import { Injectable } from '@angular/core';
import { InteractionSelection } from '@app/classes/action/interaction-selection';
import { Description } from '@app/classes/description';
import { Vec2 } from '@app/classes/vec2';
import { ClipBoardService } from '@app/services/clipboard/clipboard.service';
import { DrawingStateTrackerService } from '@app/services/drawing-state-tracker/drawing-state-tracker.service';
import { DrawingService } from '@app/services/drawing/drawing.service';
import { MagnetismService } from '@app/services/magnetism/magnetism.service';
import { ColorService } from '@app/services/tool-modifier/color/color.service';
import { TracingService } from '@app/services/tool-modifier/tracing/tracing.service';
import { WidthService } from '@app/services/tool-modifier/width/width.service';
import { EllipseService } from '@app/services/tools/ellipse/ellipse.service';
import { SelectionToolService } from '@app/services/tools/selection/selection-tool.service';
// tslint:disable:max-file-line-count
const CALLER_ID = 1;
@Injectable({
    providedIn: 'root',
})
export class EllipseSelectionService extends SelectionToolService {
    constructor(
        drawingService: DrawingService,
        private drawingStateTrackingService: DrawingStateTrackerService,
        private ellipseService: EllipseService,
        private tracingService: TracingService,
        private colorService: ColorService,
        private widthService: WidthService,
        magnetismService: MagnetismService,
        clipBoardService: ClipBoardService,
    ) {
        super(drawingService, colorService, new Description('selection ellipse', 's', 'ellipse-selection.png'), magnetismService, clipBoardService);
        this.image = new Image();
    }

    onMouseDown(event: MouseEvent): void {
        if (!this.mouseDown) {
            // if there is a tool change the selection won't reapply
            this.onEscapeDown();
        }
        this.resetSelectionPreset(event);
        // resizing
        if (this.selectionCreated && this.checkHit(this.mouseDownCoord)) {
            this.getAnchorHit(this.drawingService.previewCtx, this.mouseDownCoord, CALLER_ID);
            this.clearCanvasEllipse();
            // for undo redo
            this.pathData.push(this.firstSelectionCoord);
            this.startSelectionPoint = this.offsetAnchors(this.startDownCoord);
            // translate
        } else if (this.selectionCreated && this.hitSelection(this.mouseDownCoord.x, this.mouseDownCoord.y)) {
            this.pathLastCoord = this.getBottomRightCorner(); // for showSelection
            this.draggingImage = true;
            this.rotateCanvas();
            this.showSelection(this.drawingService.previewCtx, this.image, this.firstSelectionCoord, this.selectionSize);
            this.resetCanvasRotation();
            // creation
        } else {
            if (this.selectionCreated) {
                this.drawOnBaseCanvas();
                this.addActionTracking(this.startDownCoord);
            }
            this.ellipseService.onMouseDown(event);
            this.setValueCreation(event);
            this.selectionSize = { x: 1, y: 1 }; // to disable unwanted click
        }
        this.resetTransform();
    }

    onMouseMove(event: MouseEvent): void {
        const MOUSE_POSITION = this.getPositionFromMouse(event);
        // translate
        if (this.draggingImage && this.localMouseDown) {
            const MOUSE_POSITION_MAGNETIC = this.getPositionFromMouse(event, true); // For adjusting postion to magnetism
            this.drawingService.clearCanvas(this.drawingService.previewCtx);
            this.drawingService.clearCanvas(this.drawingService.selectionCtx);
            this.startDownCoord = this.evenImageStartCoord(MOUSE_POSITION_MAGNETIC);
            this.pathLastCoord = this.getBottomRightCorner(); // needed for showSelection
            this.rotateCanvas();
            this.showSelection(this.drawingService.previewCtx, this.image, this.firstSelectionCoord, this.selectionSize);
            this.resetCanvasRotation();
            this.startDownCoord = this.evenImageStartCoord(MOUSE_POSITION_MAGNETIC);
            // resizing
        } else if (this.clickOnAnchor && this.localMouseDown) {
            this.drawingService.clearCanvas(this.drawingService.previewCtx);
            this.drawingService.clearCanvas(this.drawingService.selectionCtx);
            this.getAnchorHit(this.drawingService.previewCtx, MOUSE_POSITION, CALLER_ID);
            // creation
        } else if (this.isInCanvas(MOUSE_POSITION) && this.localMouseDown) {
            this.ellipseService.onMouseMove(event);
            if (this.startDownCoord.x !== MOUSE_POSITION.x && this.startDownCoord.y !== MOUSE_POSITION.y && this.shiftDown) {
                const SQUARE = this.getSquaredSize(MOUSE_POSITION);
                this.selectionSize = { x: Math.abs(SQUARE.x), y: Math.abs(SQUARE.y) };
            } else if (this.startDownCoord.x !== MOUSE_POSITION.x && this.startDownCoord.y !== MOUSE_POSITION.y && !this.shiftDown) {
                this.selectionSize = { x: Math.abs(this.startDownCoord.x - MOUSE_POSITION.x), y: Math.abs(this.startDownCoord.y - MOUSE_POSITION.y) };
            }
            this.pathData.push(MOUSE_POSITION);
        }
    }

    onMouseUp(event: MouseEvent): void {
        const MOUSE_POSITION = this.getPositionFromMouse(event);
        this.drawingService.clearCanvas(this.drawingService.previewCtx);
        this.drawingService.clearCanvas(this.drawingService.selectionCtx);
        // translate
        if (this.draggingImage) {
            const MOUSE_POSITION_MAGNETIC = this.getPositionFromMouse(event, true); // For adjusting postion to magnetism
            // put selection on previewCanvas
            this.startDownCoord = this.evenImageStartCoord(MOUSE_POSITION_MAGNETIC);
            this.rotateCanvas();
            this.showSelection(this.drawingService.previewCtx, this.image, this.firstSelectionCoord, this.selectionSize);
            // draw selection box
            this.ellipseService.mouseDownCoord = this.startDownCoord;
            this.pathLastCoord = this.getBottomRightCorner();
            this.pathData.push(this.pathLastCoord);
            this.drawSelectionSurround();
            this.resetCanvasRotation();
            // set values
            this.startDownCoord = this.evenImageStartCoord(MOUSE_POSITION_MAGNETIC);
            this.draggingImage = false;
            this.hasDoneFirstTranslation = true;
            // resizing
        } else if (this.clickOnAnchor) {
            this.getAnchorHit(this.drawingService.previewCtx, MOUSE_POSITION, CALLER_ID); // draw new image on preview
            this.pathData.push({ x: this.resizeStartCoords.x + this.resizeWidth, y: this.resizeStartCoords.y + this.resizeHeight });
            const START = this.offsetAnchors(this.resizeStartCoords);
            // saves what is under the selection
            const UNDER_DATA = this.drawingService.baseCtx.getImageData(START.x, START.y, Math.abs(this.resizeWidth), Math.abs(this.resizeHeight));
            this.getAnchorHit(this.drawingService.baseCtx, MOUSE_POSITION, CALLER_ID, 0); // draw new image on base for saving image.src
            this.startDownCoord = this.offsetAnchors(this.resizeStartCoords); // set new startCoords with the resize
            this.selectionSize = { x: Math.abs(this.resizeWidth), y: Math.abs(this.resizeHeight) }; // set new size of selection
            this.image.src = this.drawingService.baseCtx.canvas.toDataURL(); // save new image with resized selection
            // puts back what was under the selection
            this.drawingService.baseCtx.putImageData(UNDER_DATA, this.startDownCoord.x, this.startDownCoord.y);
            this.pathLastCoord = this.getBottomRightCorner();
            this.addActionTracking(this.startDownCoord); // Undo redo
            // draw selection surround
            const MEMORY_COORDS = this.startDownCoord;
            this.rotateCanvas();
            this.ellipseService.mouseDownCoord = this.startDownCoord;
            this.pathData.push(this.getBottomRightCorner());
            this.drawSelectionSurround(); // draw selection box and anchor
            this.resetCanvasRotation();
            this.startDownCoord = MEMORY_COORDS;
            // set values
            this.firstSelectionCoord = this.startDownCoord; // reset firstSelectionCoord to new place on new image
            this.clickOnAnchor = false;
            this.hasDoneResizing = true;
            // creation
        } else if (this.localMouseDown) {
            // set up pathData last coords, depending on shift down or not for offsetAnchor
            if (this.shiftDown) {
                const SQUARE = this.getSquaredSize(MOUSE_POSITION);
                this.pathData.push({ x: SQUARE.x + this.startDownCoord.x, y: SQUARE.y + this.startDownCoord.y });
            } else {
                this.pathData.push(MOUSE_POSITION);
            }
            // Puts startDownCoord at the top left of the selection
            this.startDownCoord = this.offsetAnchors(this.startDownCoord);
            this.firstSelectionCoord = this.startDownCoord;
            this.addActionTracking(this.startDownCoord);
            // put selection on previewCanvas
            this.pathLastCoord = this.getBottomRightCorner();
            this.showSelection(this.drawingService.previewCtx, this.image, this.firstSelectionCoord, this.selectionSize);
            this.drawSelectionSurround();
            // remove original ellipse from base
            this.clearCanvasEllipse();
            // set up values
            this.selectionCreated = true;
        }
        this.localMouseDown = false;
        this.clearPath();
    }

    // tslint:disable:no-magic-numbers
    // needed for / 100, the point of this division is to get the orientation of the scroll, not the total displacement of the wheel
    onMouseWheel(event: WheelEvent): void {
        if (!this.mouseDown) {
            // if there is a tool change the rotation won't reapply
            this.onEscapeDown();
        }
        if (this.selectionCreated) {
            // Setting up the constants
            const MEMORY_COORDS = this.startDownCoord;
            const MEMORY_COORDS_SIZE = this.selectionSize;
            const TRANSLATION = { x: this.startDownCoord.x + this.selectionSize.x / 2, y: this.startDownCoord.y + this.selectionSize.y / 2 };
            const MAX_SIDE = Math.hypot(this.selectionSize.x, this.selectionSize.y);
            const OFFSET_START = { x: TRANSLATION.x - MAX_SIDE / 2, y: TRANSLATION.y - MAX_SIDE / 2 };
            // for undo redo
            const OLD_IMAGE: ImageData = this.drawingService.baseCtx.getImageData(OFFSET_START.x, OFFSET_START.y, MAX_SIDE, MAX_SIDE);
            // calculate desire angle for canvas rotation
            this.calculateRotation(event.altKey, event.deltaY / 100);
            // clearing canvas for rotation
            this.drawingService.clearCanvas(this.drawingService.previewCtx);
            this.drawingService.clearCanvas(this.drawingService.selectionCtx);
            // does translation and rotation of the canvas
            this.rotateCanvas();
            this.showSelection(this.drawingService.previewCtx, this.image, this.firstSelectionCoord, this.selectionSize); // draw new image on preview
            // draw new image on base for saving for undo/redo
            this.showSelection(this.drawingService.baseCtx, this.image, this.firstSelectionCoord, this.selectionSize);
            this.selectionSize = { x: MAX_SIDE, y: MAX_SIDE }; // set selectionSize to new value for addActionTracking
            this.addActionTracking({ x: OFFSET_START.x, y: OFFSET_START.y }); // saves undo/redo
            this.selectionSize = MEMORY_COORDS_SIZE; // set back selectionSize to original value
            this.drawingService.baseCtx.putImageData(OLD_IMAGE, OFFSET_START.x, OFFSET_START.y); // reput the old image on base canvas
            // draw selection surround
            this.ellipseService.mouseDownCoord = this.startDownCoord;
            this.pathData.push(this.getBottomRightCorner());
            this.drawSelectionSurround();
            // reset canvas transform after rotation
            this.resetCanvasRotation();
            this.hasDoneFirstRotation = this.angle !== 0 ? true : false;
            // reset startDownCoord to original value
            this.startDownCoord = MEMORY_COORDS;
        }
    }

    private showSelection(canvas: CanvasRenderingContext2D, image: HTMLImageElement, imageStart: Vec2, size: Vec2): void {
        canvas.save();
        const ELLIPSE_PATH = this.getPath(this.startDownCoord);
        canvas.clip(ELLIPSE_PATH);
        this.drawImage(canvas, image, imageStart, this.selectionSize, this.startDownCoord, size);
        canvas.restore();
    }

    private clearCanvasEllipse(): void {
        this.pathLastCoord = this.getBottomRightCorner();
        const START = { x: this.startDownCoord.x - 1, y: this.startDownCoord.y - 1 }; // needed to remove the outline after resizing
        this.pathLastCoord = { x: this.pathLastCoord.x + 1, y: this.pathLastCoord.y + 1 };
        const PATH = this.getPath(START);
        PATH.closePath();
        this.drawingService.baseCtx.fillStyle = 'white';
        this.drawingService.baseCtx.fill(PATH, 'evenodd');
        this.pathLastCoord = this.getBottomRightCorner();
    }

    private drawSelectionSurround(): void {
        this.ellipseService.drawEllipse(this.drawingService.selectionCtx, this.pathData);
        this.ellipseService.drawPreviewRect(this.drawingService.selectionCtx, this.pathData);
        this.drawnAnchor(this.drawingService.selectionCtx);
    }

    private resetTransform(): void {
        this.widthService.setWidth(1);
        this.colorService.setPrimaryColor('#000000');
        this.colorService.setSecondaryColor('#000000');
        this.tracingService.setHasFill(false);
        this.tracingService.setHasContour(true);
    }

    private addActionTracking(position: Vec2): void {
        const TRACKING_INFO = this.getActionTrackingInfo(position);
        const IMAGE_DATA_SELECTION = this.drawingService.baseCtx.getImageData(
            TRACKING_INFO[0].x,
            TRACKING_INFO[0].y,
            TRACKING_INFO[1].x - TRACKING_INFO[0].x,
            TRACKING_INFO[1].y - TRACKING_INFO[0].y,
        );
        this.drawingStateTrackingService.addAction(
            this,
            new InteractionSelection({ x: TRACKING_INFO[0].x, y: TRACKING_INFO[0].y }, IMAGE_DATA_SELECTION),
        );
    }

    drawOnBaseCanvas(): void {
        // puts selection on baseCanvas
        if (this.selectionCreated) {
            this.rotateCanvas();
            this.showSelection(this.drawingService.baseCtx, this.image, this.firstSelectionCoord, this.selectionSize);
            this.resetCanvasRotation();
        }
        this.tracingService.setHasFill(true);
        this.tracingService.setHasContour(true);
        this.selectionCreated = false;
    }

    onEscapeDown(): void {
        if (this.selectionCreated) {
            this.drawOnBaseCanvas();
            this.addActionTracking(this.startDownCoord);
        }
        this.drawingService.clearCanvas(this.drawingService.previewCtx);
        this.drawingService.clearCanvas(this.drawingService.selectionCtx);
        this.selectionCreated = false;
        this.arrowDown = true;
    }

    onShiftDown(event: KeyboardEvent): void {
        if (!event.ctrlKey) {
            return;
        }
        this.shiftDown = true;
        if (this.clickOnAnchor) {
            this.ratio = this.getRatio(this.selectionSize.x, this.selectionSize.y);
        } else {
            this.ellipseService.shiftDown = true;
            if (this.localMouseDown) {
                const MOUSE_EVENT = this.createOnMouseMoveEvent();
                this.onMouseMove(MOUSE_EVENT);
            }
        }
    }

    onShiftUp(event: KeyboardEvent): void {
        if (event.ctrlKey) {
            return;
        }
        this.shiftDown = false;
        if (!this.clickOnAnchor) {
            this.ellipseService.shiftDown = false;
            if (this.localMouseDown) {
                const MOUSE_EVENT = this.createOnMouseMoveEvent();
                this.onMouseMove(MOUSE_EVENT);
            }
        }
    }

    onArrowDown(event: KeyboardEvent): void {
        if (!this.arrowDown) {
            this.drawingService.clearCanvas(this.drawingService.previewCtx);
            this.drawingService.clearCanvas(this.drawingService.selectionCtx);
        }
        if (this.selectionCreated) {
            this.drawingService.clearCanvas(this.drawingService.previewCtx);
            this.drawingService.clearCanvas(this.drawingService.selectionCtx);
            this.checkArrowHit(event);
            const TEMP = this.startDownCoord; // needed because rotateCanvas changes the value
            this.rotateCanvas();
            this.showSelection(this.drawingService.previewCtx, this.image, this.firstSelectionCoord, this.selectionSize);
            this.resetCanvasRotation();
            this.startDownCoord = TEMP; // reset value
        }
    }

    onArrowUp(event: KeyboardEvent): void {
        if (this.selectionCreated) {
            this.checkArrowUnhit(event);
            this.drawingService.clearCanvas(this.drawingService.previewCtx);
            this.drawingService.clearCanvas(this.drawingService.selectionCtx);
            if (this.arrowPress.every((v) => !v)) {
                this.arrowDown = false;
                const MEM_COORDS = this.startDownCoord;
                this.clearPath();
                this.pathLastCoord = this.getBottomRightCorner();
                this.pathData.push(this.pathLastCoord);
                this.rotateCanvas();
                this.showSelection(this.drawingService.previewCtx, this.image, this.firstSelectionCoord, this.selectionSize);
                // draw selection box
                this.ellipseService.mouseDownCoord = this.startDownCoord;
                this.pathData.push(this.getBottomRightCorner());
                this.drawSelectionSurround();
                this.resetCanvasRotation();
                this.startDownCoord = MEM_COORDS; // needed because rotateCanvas changes the value
                this.hasDoneFirstTranslation = true;
            }
            if (this.arrowDown) {
                this.onArrowDown({} as KeyboardEvent);
            }
        }
    }

    onCtrlADown(): void {
        this.drawingService.clearCanvas(this.drawingService.previewCtx);
        this.drawingService.clearCanvas(this.drawingService.selectionCtx);
        this.resetTransform();
        this.localMouseDown = true;
        this.startDownCoord = { x: 0, y: 0 };
        this.firstSelectionCoord = { x: 0, y: 0 };
        this.ellipseService.mouseDownCoord = { x: 0, y: 0 };
        this.image.src = this.drawingService.baseCtx.canvas.toDataURL();
        this.selectionSize = { x: this.drawingService.baseCtx.canvas.width, y: this.drawingService.baseCtx.canvas.height };
        const MOUSE_EVENT = {
            offsetX: this.selectionSize.x,
            offsetY: this.selectionSize.y,
            button: 0,
        } as MouseEvent;
        this.onMouseUp(MOUSE_EVENT);
    }

    execute(interaction: InteractionSelection): void {
        this.selectionCreated = false;
        this.drawingService.baseCtx.putImageData(interaction.selection, interaction.startSelectionPoint.x, interaction.startSelectionPoint.y);
        this.drawingService.clearCanvas(this.drawingService.previewCtx);
        this.drawingService.clearCanvas(this.drawingService.selectionCtx);
    }
}
