import { Injectable } from '@angular/core';
import { InteractionSelection } from '@app/classes/action/interaction-selection';
import { Description } from '@app/classes/description';
import { MouseButton } from '@app/classes/mouse';
import { Vec2 } from '@app/classes/vec2';
import { ClipBoardService } from '@app/services/clipboard/clipboard.service';
import { DrawingStateTrackerService } from '@app/services/drawing-state-tracker/drawing-state-tracker.service';
import { DrawingService } from '@app/services/drawing/drawing.service';
import { MagnetismService } from '@app/services/magnetism/magnetism.service';
import { ColorService } from '@app/services/tool-modifier/color/color.service';
import { TracingService } from '@app/services/tool-modifier/tracing/tracing.service';
import { WidthService } from '@app/services/tool-modifier/width/width.service';
import { RectangleService } from '@app/services/tools/rectangle/rectangle.service';
import { SelectionToolService } from '@app/services/tools/selection/selection-tool.service';
// tslint:disable:max-file-line-count
const CALLER_ID = 3;
@Injectable({
    providedIn: 'root',
})
export class MagicWandService extends SelectionToolService {
    private startR: number;
    private startG: number;
    private startB: number;
    private edgePixelsAllRegions: Vec2[] = [];
    protected pathLastCoord: Vec2;
    private canvasData: Uint8ClampedArray;

    constructor(
        drawingService: DrawingService,
        private drawingStateTrackingService: DrawingStateTrackerService,
        private rectangleService: RectangleService,
        private tracingService: TracingService,
        private widthService: WidthService,
        private colorService: ColorService,
        magnetismService: MagnetismService,
        clipBoardService: ClipBoardService,
    ) {
        super(drawingService, colorService, new Description('Baguette magique', 'v', 'magic-wand.png'), magnetismService, clipBoardService);
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
            this.clearCanvasSelection();
            this.pathLastCoord = this.mouseDownCoord;
            this.startSelectionPoint = this.startDownCoord;
            // translate
        } else if (this.selectionCreated && this.hitSelection(this.mouseDownCoord.x, this.mouseDownCoord.y)) {
            this.draggingImage = true;
            this.rotateCanvas();
            this.showSelection(this.drawingService.previewCtx, this.image, this.firstSelectionCoord, this.selectionSize);
            this.resetCanvasRotation();
            // Creation
        } else {
            if (this.selectionCreated) {
                this.drawOnBaseCanvas();
                this.addActionTracking(this.startDownCoord);
            }
            let pixelsSelected: Vec2[];
            this.setStartColor();
            this.edgePixelsAllRegions = [];
            this.edgePixelsSplitted = [];
            this.scanCanvas();
            if (event.button === MouseButton.Left) {
                pixelsSelected = this.floodFillSelect(this.mouseDownCoord);
            } else {
                pixelsSelected = this.sameColorSelect();
            }
            this.setValueCreation(event);
            this.drawRect(pixelsSelected);
            // set variables
            this.selectionCreated = true;
            this.localMouseDown = false;
        }
        this.resetTransform();
        this.mouseDown = true;
    }

    onMouseMove(event: MouseEvent): void {
        const MOUSE_POSITION = this.getPositionFromMouse(event);
        // translate
        if (this.draggingImage && this.localMouseDown) {
            const MOUSE_POSITION_MAGNETIC = this.getPositionFromMouse(event, true);
            this.drawingService.clearCanvas(this.drawingService.previewCtx);
            this.drawingService.clearCanvas(this.drawingService.selectionCtx);
            this.startDownCoord = this.evenImageStartCoord(MOUSE_POSITION_MAGNETIC);
            this.rotateCanvas();
            this.showSelection(this.drawingService.previewCtx, this.image, this.firstSelectionCoord, this.selectionSize);
            this.resetCanvasRotation();
            this.startDownCoord = this.evenImageStartCoord(MOUSE_POSITION_MAGNETIC);
            // resizing
        } else if (this.clickOnAnchor && this.localMouseDown) {
            this.drawingService.clearCanvas(this.drawingService.previewCtx);
            this.drawingService.clearCanvas(this.drawingService.selectionCtx);
            this.getAnchorHit(this.drawingService.previewCtx, MOUSE_POSITION, CALLER_ID);
        }
    }

    onMouseUp(event: MouseEvent): void {
        const MOUSE_POSITION = this.getPositionFromMouse(event);
        // translate
        if (this.draggingImage) {
            const MOUSE_POSITION_MAGNETIC = this.getPositionFromMouse(event, true);
            this.drawingService.clearCanvas(this.drawingService.previewCtx);
            this.drawingService.clearCanvas(this.drawingService.selectionCtx);
            this.startDownCoord = this.evenImageStartCoord(MOUSE_POSITION_MAGNETIC);
            this.rotateCanvas();
            this.showSelection(this.drawingService.previewCtx, this.image, this.firstSelectionCoord, this.selectionSize);
            // draw selection surround
            this.rectangleService.mouseDownCoord = this.startDownCoord;
            this.pathLastCoord = this.getBottomRightCorner();
            this.pathData.push(this.pathLastCoord);
            this.drawSelectionSurround();
            this.resetCanvasRotation();
            this.startDownCoord = this.evenImageStartCoord(MOUSE_POSITION);
            // set values
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
            this.rectangleService.mouseDownCoord = this.startDownCoord;
            this.pathData.push(this.getBottomRightCorner());
            this.drawSelectionSurround(); // draw selection box and anchor
            this.resetCanvasRotation();
            this.startDownCoord = MEMORY_COORDS;
            // set values
            this.firstSelectionCoord = this.startDownCoord; // reset firstSelectionCoord to new place on new image
            this.clickOnAnchor = false;
            this.hasDoneResizing = true;
            // Creation
        } else {
            this.addActionTracking(this.startDownCoord);
            this.showSelection(this.drawingService.previewCtx, this.image, this.firstSelectionCoord, this.selectionSize);
            this.clearCanvasSelection();
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
            this.rectangleService.mouseDownCoord = this.startDownCoord;
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
        const path = this.getPathToClip();
        canvas.clip(path);
        this.drawImage(canvas, image, imageStart, this.selectionSize, this.startDownCoord, size);
        canvas.restore();
    }

    private clearCanvasSelection(): void {
        const PATH = this.getPathToClip();
        PATH.closePath();
        this.drawingService.baseCtx.fillStyle = 'white';
        this.drawingService.baseCtx.fill(PATH, 'evenodd');
    }

    private drawSelectionSurround(): void {
        this.rectangleService.drawPreviewRect(this.drawingService.selectionCtx, this.pathData);
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

    private drawRect(pixelsSelected: Vec2[]): void {
        let xMin = pixelsSelected[0].x;
        let xMax = pixelsSelected[0].x;
        let yMin = pixelsSelected[0].y;
        let yMax = pixelsSelected[0].y;
        for (const pixel of pixelsSelected) {
            if (pixel.x < xMin) xMin = pixel.x;
            if (pixel.x > xMax) xMax = pixel.x;
            if (pixel.y < yMin) yMin = pixel.y;
            if (pixel.y > yMax) yMax = pixel.y;
        }

        // Save the position of the rectangle delimited by the same color pixels
        this.startDownCoord = { x: xMin, y: yMin };
        this.selectionSize = { x: xMax - xMin, y: yMax - yMin };
        this.pathStartCoordReference = this.startDownCoord;
        this.pathLastCoord = this.getBottomRightCorner();
        this.firstSelectionCoord = this.startDownCoord;
        this.startSelectionPoint = this.startDownCoord;

        // Drawing of the preview rectangle and the selection contour
        this.pathData.push({ x: xMax, y: yMax });
        this.rectangleService.mouseDownCoord = this.startDownCoord;
        this.splitAndSortEdgeArray();
        this.drawSelectionSurround();
    }

    // tslint:disable:cyclomatic-complexity
    private floodFillSelect(pixelClicked: Vec2): Vec2[] {
        this.edgePixelsAllRegions = [];
        const pixelsSelectedCoord: Vec2[] = [];
        const pixelStack: Vec2[] = [];
        const pixelsSelectedValidation: boolean[] = [];
        pixelsSelectedValidation.fill(false, 0, this.drawingService.baseCtx.canvas.width * (this.drawingService.baseCtx.canvas.height - 2));
        pixelStack.push(pixelClicked);
        while (pixelStack.length) {
            const pixelPos = pixelStack.pop() as Vec2;
            const xPosition = pixelPos.x;
            let yPosition = pixelPos.y;
            // Get current pixel position
            // Go up as long as the color matches and are inside the canvas
            // tslint:disable-next-line:no-magic-numbers
            while (yPosition-- > -1 && this.matchStartColor(pixelPos) && !this.isSelected(pixelsSelectedValidation, pixelPos)) {
                pixelPos.y -= 1;
            }
            pixelPos.y += 1;
            ++yPosition;

            let reachLeft = false;
            let reachRight = false;

            while (
                yPosition++ <= this.drawingService.baseCtx.canvas.height - 2 &&
                this.matchStartColor(pixelPos) &&
                !this.isSelected(pixelsSelectedValidation, pixelPos)
            ) {
                pixelsSelectedCoord.push({ x: pixelPos.x, y: pixelPos.y } as Vec2);
                pixelsSelectedValidation[pixelPos.y * this.drawingService.baseCtx.canvas.width + pixelPos.x] = true;
                if (this.isEdgePixel({ x: pixelPos.x, y: pixelPos.y })) this.edgePixelsAllRegions.push({ x: pixelPos.x, y: pixelPos.y });

                if (xPosition > 0) {
                    if (
                        this.matchStartColor({ x: pixelPos.x - 1, y: pixelPos.y }) &&
                        !this.isSelected(pixelsSelectedValidation, { x: pixelPos.x - 1, y: pixelPos.y })
                    ) {
                        if (!reachLeft) {
                            pixelStack.push({ x: xPosition - 1, y: yPosition });
                            reachLeft = true;
                        }
                    } else if (reachLeft) {
                        reachLeft = false;
                    }
                }
                if (xPosition < this.drawingService.baseCtx.canvas.width) {
                    if (
                        this.matchStartColor({ x: pixelPos.x + 1, y: pixelPos.y }) &&
                        !this.isSelected(pixelsSelectedValidation, { x: pixelPos.x + 1, y: pixelPos.y })
                    ) {
                        if (!reachRight) {
                            pixelStack.push({ x: xPosition + 1, y: yPosition });
                            reachRight = true;
                        }
                    } else if (reachRight) {
                        reachRight = false;
                    }
                    pixelPos.y += 1;
                }
            }
        }
        return pixelsSelectedCoord;
    }

    private sameColorSelect(): Vec2[] {
        const pixelSelected: Vec2[] = [];
        const pixelPos: Vec2 = { x: 0, y: 0 };
        while (pixelPos.y < this.drawingService.baseCtx.canvas.height) {
            while (pixelPos.x < this.drawingService.baseCtx.canvas.width) {
                if (this.matchStartColor(pixelPos)) {
                    pixelSelected.push({ x: pixelPos.x, y: pixelPos.y });
                    if (this.isEdgePixel(pixelPos)) this.edgePixelsAllRegions.push({ x: pixelPos.x, y: pixelPos.y });
                }
                pixelPos.x++;
            }
            pixelPos.y++;
            pixelPos.x = 0;
        }
        return pixelSelected;
    }

    private scanCanvas(): void {
        this.canvasData = this.drawingService.baseCtx.getImageData(
            0,
            0,
            this.drawingService.baseCtx.canvas.width,
            this.drawingService.baseCtx.canvas.height - 2,
        ).data;
    }

    private matchStartColor(pixelPos: Vec2): boolean {
        const stepSize = 4;
        return (
            this.canvasData[stepSize * (pixelPos.y * this.drawingService.baseCtx.canvas.width + pixelPos.x)] === this.startR &&
            this.canvasData[stepSize * (pixelPos.y * this.drawingService.baseCtx.canvas.width + pixelPos.x) + 1] === this.startG &&
            this.canvasData[stepSize * (pixelPos.y * this.drawingService.baseCtx.canvas.width + pixelPos.x) + 2] === this.startB
        );
    }
    private isSelected(pixelsSelected: boolean[], pixelPos: Vec2): boolean {
        return pixelsSelected[pixelPos.y * this.drawingService.baseCtx.canvas.width + pixelPos.x];
    }

    private setStartColor(): void {
        // get the pixel on the first Path of mouse
        const imageData: ImageData = this.drawingService.baseCtx.getImageData(this.mouseDownCoord.x, this.mouseDownCoord.y, 1, 1);
        this.startR = imageData.data[0];
        this.startG = imageData.data[1];
        this.startB = imageData.data[2];
    }

    private isEdgePixel(pixel: Vec2): boolean {
        const distanceToCheck = 3;
        const stepBetweenPixel = 4;
        const data = this.drawingService.baseCtx.getImageData(pixel.x - 1, pixel.y - 1, distanceToCheck, distanceToCheck).data;

        for (let i = 0; i < data.length; i += stepBetweenPixel) {
            if (!(data[i] === this.startR) || !(data[i + 1] === this.startG) || !(data[i + 2] === this.startB)) return true;
        }
        return false;
    }

    drawOnBaseCanvas(): void {
        // puts selection on baseCanvas
        if (this.selectionCreated) {
            if (this.hasDoneFirstRotation) {
                this.rotateCanvas();
            }
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
            this.shiftDown = true;
            this.ratio = this.getRatio(this.selectionSize.x, this.selectionSize.y);
        }
    }

    onShiftUp(event: KeyboardEvent): void {
        if (!event.ctrlKey) {
            this.shiftDown = false;
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
                this.rectangleService.mouseDownCoord = this.startDownCoord;
                this.rotateCanvas();
                this.showSelection(this.drawingService.previewCtx, this.image, this.firstSelectionCoord, this.selectionSize);
                this.rectangleService.mouseDownCoord = this.startDownCoord;
                this.pathData.push(this.getBottomRightCorner());
                this.drawSelectionSurround();
                this.resetCanvasRotation();
                this.startDownCoord = MEM_COORDS; // needed because rotateCanvas changes the value
                this.hasDoneFirstTranslation = true;
            }
        }
    }

    splitAndSortEdgeArray(): void {
        const distanceBetweenEdgePixels = 1;
        let regionIndex = -1;
        while (this.edgePixelsAllRegions.length) {
            regionIndex++;
            const newRegion: Vec2[] = [this.edgePixelsAllRegions[0]];
            this.edgePixelsAllRegions.splice(0, 1);
            for (const value of newRegion) {
                for (let j = 0; j < this.edgePixelsAllRegions.length; j++) {
                    if (
                        ((value.x - this.edgePixelsAllRegions[j].x === distanceBetweenEdgePixels ||
                            value.x - this.edgePixelsAllRegions[j].x === -distanceBetweenEdgePixels) &&
                            value.y - this.edgePixelsAllRegions[j].y === 0) ||
                        ((value.y - this.edgePixelsAllRegions[j].y === distanceBetweenEdgePixels ||
                            value.y - this.edgePixelsAllRegions[j].y === -distanceBetweenEdgePixels) &&
                            value.x - this.edgePixelsAllRegions[j].x === 0)
                    ) {
                        newRegion.push(this.edgePixelsAllRegions[j]);
                        this.edgePixelsAllRegions.splice(j, 1);
                        break;
                    }
                }
            }
            // Prevents unlinked edge pixel to form regions
            if (!(newRegion.length === 1)) {
                this.edgePixelsSplitted.push({ edgePixels: [] });
                this.edgePixelsSplitted[regionIndex].edgePixels = newRegion;
            } else {
                regionIndex--;
            }
        }
        // Also stores the relative position of every edge pixel to be used for resize
        regionIndex = -1;
        for (const region of this.edgePixelsSplitted) {
            regionIndex++;
            this.edgePixelsSplittedRelativePosition.push({ edgePixels: [] });
            for (const edge of region.edgePixels) {
                const relativePosition: Vec2 = {
                    x: (edge.x - this.startDownCoord.x) / this.selectionSize.x,
                    y: (edge.y - this.startDownCoord.y) / this.selectionSize.y,
                };
                this.edgePixelsSplittedRelativePosition[regionIndex].edgePixels.push(relativePosition);
            }
        }
    }

    execute(interaction: InteractionSelection): void {
        this.selectionCreated = false;
        this.drawingService.baseCtx.putImageData(interaction.selection, interaction.startSelectionPoint.x, interaction.startSelectionPoint.y);
        this.drawingService.clearCanvas(this.drawingService.previewCtx);
        this.drawingService.clearCanvas(this.drawingService.selectionCtx);
    }
}
