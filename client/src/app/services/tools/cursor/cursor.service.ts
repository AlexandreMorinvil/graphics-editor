import { Injectable } from '@angular/core';
import { InteractionResize } from '@app/classes/action/interaction-resize';
import { Description } from '@app/classes/description';
import { Tool } from '@app/classes/tool';
import { Vec2 } from '@app/classes/vec2';
import { DrawingStateTrackerService } from '@app/services/drawing-state-tracker/drawing-state-tracker.service';
import { DrawingService } from '@app/services/drawing/drawing.service';

const minSurfaceSize = 250;
export enum Anchors {
    Default = 0,
    BottomRight = 1,
    MiddleRight = 2,
    BottomMiddle = 3,
}
@Injectable({
    providedIn: 'root',
})
export class CursorService extends Tool {
    mouseDownCoord: Vec2;
    mouseDown: boolean = false;
    private dotsize: number = 10;
    private clickOnAnchor: boolean = false;
    private anchorHit: number = 0;

    constructor(drawingService: DrawingService, private drawingStateTrackingService: DrawingStateTrackerService) {
        super(drawingService, new Description('redimensionneur', 'y', 'crop-icon.png'));
    }

    onMouseDown(event: MouseEvent): void {
        this.drawingService.previewCtx.fillStyle = '#000000';
        this.mouseDownCoord = this.getPositionFromMouse(event);
        this.drawnAnchor(this.drawingService.previewCtx, this.drawingService.canvas);
        this.checkHit(this.mouseDownCoord, this.drawingService.canvas);
        this.mouseDown = true;
    }

    onMouseUp(event: MouseEvent): void {
        this.clickOnAnchor = false;
        this.mouseDown = false;
        if (
            this.drawingService.baseCtx.canvas.width === this.drawingService.previewCtx.canvas.width &&
            this.drawingService.baseCtx.canvas.height === this.drawingService.previewCtx.canvas.height
        )
            return;
        this.drawnAnchor(this.drawingService.previewCtx, this.drawingService.canvas);
        this.resizeDrawingZone(this.drawingService.previewCtx.canvas.width, this.drawingService.previewCtx.canvas.height);
        this.drawingStateTrackingService.addAction(
            this,
            new InteractionResize({
                x: this.drawingService.baseCtx.canvas.width,
                y: this.drawingService.baseCtx.canvas.height,
            }),
        );
    }

    onMouseMove(event: MouseEvent): void {
        if (!this.clickOnAnchor || !this.mouseDown) {
            return;
        }
        this.mouseDownCoord = this.getPositionFromMouse(event);
        switch (this.anchorHit) {
            case Anchors.BottomRight:
                this.moveWidth(this.mouseDownCoord.x);
                this.moveHeight(this.mouseDownCoord.y);
                break;
            case Anchors.MiddleRight:
                this.moveWidth(this.mouseDownCoord.x);
                break;
            case Anchors.BottomMiddle:
                this.moveHeight(this.mouseDownCoord.y);
                break;
            default:
                this.anchorHit = Anchors.Default;
                break;
        }
    }

    private resizeDrawingZone(width: number, height: number): void {
        this.drawingService.resize(width, height);
    }

    private moveWidth(mouseDownCoordX: number): void {
        this.drawingService.previewCtx.canvas.width = mouseDownCoordX >= minSurfaceSize ? mouseDownCoordX : minSurfaceSize;
    }

    private moveHeight(mouseDownCoordY: number): void {
        this.drawingService.previewCtx.canvas.height = mouseDownCoordY >= minSurfaceSize ? mouseDownCoordY : minSurfaceSize;
    }

    private drawnAnchor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
        ctx.beginPath();
        ctx.arc(canvas.width, canvas.height, this.dotsize, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.arc(canvas.width / 2, canvas.height, this.dotsize, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.arc(canvas.width, canvas.height / 2, this.dotsize, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
    }

    private checkHit(mouse: Vec2, canvas: HTMLCanvasElement): void {
        let x: number;
        let y: number;
        const DOT_SIZE_SQUARE: number = Math.pow(this.dotsize, 2);

        x = Math.pow(mouse.x - canvas.width, 2);
        y = Math.pow(mouse.y - canvas.height, 2);
        if (x + y <= DOT_SIZE_SQUARE) {
            this.clickOnAnchor = true;
            this.anchorHit = Anchors.BottomRight;
        }

        x = Math.pow(mouse.x - canvas.width, 2);
        y = Math.pow(mouse.y - canvas.height / 2, 2);
        if (x + y <= DOT_SIZE_SQUARE) {
            this.clickOnAnchor = true;
            this.anchorHit = Anchors.MiddleRight;
        }

        x = Math.pow(mouse.x - canvas.width / 2, 2);
        y = Math.pow(mouse.y - canvas.height, 2);
        if (x + y <= DOT_SIZE_SQUARE) {
            this.clickOnAnchor = true;
            this.anchorHit = Anchors.BottomMiddle;
        }

        if (!this.clickOnAnchor) {
            this.clickOnAnchor = false;
            this.anchorHit = Anchors.Default;
        }
    }

    execute(interaction: InteractionResize): void {
        this.resizeDrawingZone(interaction.size.x, interaction.size.y);
    }
}
