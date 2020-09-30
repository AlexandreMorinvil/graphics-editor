import { Injectable } from '@angular/core';
import { Description } from '@app/classes/description';
import { Tool } from '@app/classes/tool';
import { Vec2 } from '@app/classes/vec2';
import { DrawingService } from '@app/services/drawing/drawing.service';
import { ColorService } from '@app/services/tool-modifier/color/color.service';
import { JunctionService } from '@app/services/tool-modifier/junction/junction.service';
import { WidthService } from '@app/services/tool-modifier/width/width.service';

export enum MouseButton {
    Left = 0,
    Middle = 1,
    Right = 2,
    Back = 3,
    Forward = 4,
}

export enum AlignmentAngle {
    right = 0,
    topRight = 45,
    top = 90,
    topLeft = 135,
    left = 180,
    bottomLeft = 225,
    bottom = 270,
    bottomRight = 315,
}

@Injectable({
    providedIn: 'root',
})
export class LineService extends Tool {
    private pathData: Vec2[];
    private pathDataSaved: Vec2[];
    private savedImage: ImageData;
    private undo: ImageData[];
    private click: number;
    alignmentCoord: Vec2;
    constructor(
        drawingService: DrawingService,
        private colorService: ColorService,
        private junctionService: JunctionService,
        private widthService: WidthService,
    ) {
        super(drawingService, new Description('line', 'l', 'line_icon.png'));
        this.clearPath();
        this.clearPathSaved();
        this.click = 0;
        this.undo = [];

        this.modifiers.push(this.colorService);
        this.modifiers.push(this.widthService);
        this.modifiers.push(this.junctionService);
    }

    onMouseMove(event: MouseEvent): void {
        const mousePosition = this.getPositionFromMouse(event);

        if (this.mouseClick && !event.shiftKey) {
            if (this.isInCanvas(mousePosition)) {
                this.drawingService.clearCanvas(this.drawingService.previewCtx);
                this.pathData[0] = this.mouseDownCoord;
                this.pathData.push(mousePosition);
                this.drawLine(this.drawingService.previewCtx, this.pathData);
                // On dessine sur le canvas de prévisualisation et on l'efface à chaque déplacement de la souris
            } else {
                this.drawingService.clearCanvas(this.drawingService.previewCtx);
                this.clearPath();
            }
        } else if (this.mouseClick && event.shiftKey) {
            this.drawingService.clearCanvas(this.drawingService.previewCtx);

            this.pathData.push(mousePosition);
            this.drawAlignLine(this.drawingService.previewCtx, this.pathData);
        }
    }

    onShiftUp() {
        this.drawingService.clearCanvas(this.drawingService.previewCtx);
        this.drawLine(this.drawingService.previewCtx, this.pathData);
    }

    onBackspaceDown(): void {
        if (this.undo.length > 1) {
            if (this.pathDataSaved.length > 0) {
                this.drawingService.clearCanvas(this.drawingService.previewCtx);
                this.mouseDownCoord = this.pathDataSaved[this.pathDataSaved.length - 2];
                this.pathDataSaved.pop();
                this.drawingService.baseCtx.putImageData(this.undo[this.undo.length - 2], 0, 0);
                this.undo.pop();
            }
        }
    }

    onEscapeDown(): void {
        this.mouseClick = false;
        this.drawingService.clearCanvas(this.drawingService.previewCtx);
        this.click = 0;
        this.clearPath();
        this.clearPathSaved();
    }

    onMouseClick(event: MouseEvent): void {
        let timer;
        console.log('pressed!');

        this.mouseClick = event.button === MouseButton.Left;
        if (this.mouseClick) {
            this.click++;
            if (this.click === 1) {
                timer = setTimeout(() => {
                    this.click = 0;
                }, 200);
            } else if (this.click === 2) {
                clearTimeout(timer);
                this.click = 0;
                this.onMouseDoubleClickEvent(event);
                this.mouseClick = false;
            }
            if (this.click == 1 && !event.shiftKey) {
                this.mouseDownCoord = this.getPositionFromMouse(event);
                this.pathData.push(this.mouseDownCoord);
                this.drawingService.clearCanvas(this.drawingService.previewCtx);
                this.drawLine(this.drawingService.baseCtx, this.pathData);
                this.drawJunction(this.drawingService.baseCtx, this.pathData);
                this.savedPoints();
                //console.log(this.undo.length);
                this.clearPath();
            }
            if (this.click == 1 && event.shiftKey) {
                this.drawingService.clearCanvas(this.drawingService.previewCtx);
                this.drawAlignLine(this.drawingService.baseCtx, this.pathData);
                this.pathData[0] = this.alignmentCoord;
                this.mouseDownCoord = this.alignmentCoord;
                this.drawJunction(this.drawingService.baseCtx, this.pathData);
                this.savedPoints();
                console.log(this.undo.length);
            }
        }
    }

    private onMouseDoubleClickEvent(event: MouseEvent): void {
        this.clearPath();
        if (this.isAround20Pixels()) {
            this.closeShape();
        }
        this.clearPathSaved();
    }

    private isInCanvas(mousePosition: Vec2): boolean {
        return mousePosition.x <= this.drawingService.previewCtx.canvas.width && mousePosition.y <= this.drawingService.previewCtx.canvas.height;
    }

    private drawLine(ctx: CanvasRenderingContext2D, path: Vec2[]): void {
        ctx.beginPath();
        let firstPath = path[0];
        let lastPath = path[path.length - 1];
        ctx.moveTo(firstPath.x, firstPath.y);
        ctx.lineTo(lastPath.x, lastPath.y);
        ctx.globalAlpha = this.colorService.getPrimaryColorOpacity();
        ctx.lineWidth = this.widthService.getWidth(); // width ajustment
        ctx.strokeStyle = this.colorService.getPrimaryColor(); // color of the line
        ctx.fillStyle = this.colorService.getPrimaryColor(); // color of the starting point
        ctx.stroke();
    }

    private drawJunction(ctx: CanvasRenderingContext2D, path: Vec2[]): void {
        if (this.junctionService.getHasJunctionPoint()) {
            ctx.beginPath();
            const radius = this.junctionService.getDiameter() / 2;
            const startCenterX = this.mouseDownCoord.x;
            const startCenterY = this.mouseDownCoord.y;
            ctx.arc(startCenterX, startCenterY, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    private isAround20Pixels(): boolean {
        let firstCurrentPoint = this.pathDataSaved[0];
        let lastCurrentPoint = this.pathDataSaved[this.pathDataSaved.length - 1];
        let diffXPosition = lastCurrentPoint.x - firstCurrentPoint.x;
        let diffYPosition = lastCurrentPoint.y - firstCurrentPoint.y;
        let xSideTriangleSquared = Math.pow(diffXPosition, 2);
        let ySideTriangleSquared = Math.pow(diffYPosition, 2);
        let hypothenus = Math.sqrt(xSideTriangleSquared + ySideTriangleSquared);
        if (hypothenus <= 200) {
            console.log(hypothenus);
            return true;
        }
        return false;
    }

    private closeShape(): void {
        this.drawingService.baseCtx.beginPath();
        let firstPath = this.pathDataSaved[0];
        let lastPath = this.pathDataSaved[this.pathDataSaved.length - 1];
        this.drawingService.baseCtx.moveTo(firstPath.x, firstPath.y);
        this.drawingService.baseCtx.lineTo(lastPath.x, lastPath.y);
        this.drawingService.baseCtx.stroke();
        this.mouseDownCoord = this.pathDataSaved[0];
        this.drawJunction(this.drawingService.baseCtx, this.pathData);
    }

    private savedPoints(): void {
        this.pathDataSaved.push(this.mouseDownCoord);
        this.savedImage = this.drawingService.baseCtx.getImageData(0, 0, this.drawingService.canvas.width, this.drawingService.canvas.height);
        this.undo.push(this.savedImage);
        console.log('newPointAdded');
    }
    drawAlignLine(ctx: CanvasRenderingContext2D, path: Vec2[]): void {
        ctx.beginPath();
        const alignmentAngle = this.findAlignmentAngle(path);
        const firstPath = path[0];
        const lastPath = path[path.length - 1];
        const lengthX = Math.abs(lastPath.x - firstPath.x);

        ctx.moveTo(firstPath.x, firstPath.y);
        ctx.globalAlpha = this.colorService.getPrimaryColorOpacity();
        ctx.lineWidth = this.widthService.getWidth(); // width ajustment
        ctx.strokeStyle = this.colorService.getPrimaryColor(); // color of the line
        ctx.fillStyle = this.colorService.getPrimaryColor(); // color of the starting point
        switch (alignmentAngle) {
            case 0:
                ctx.lineTo(lastPath.x, firstPath.y);
                ctx.stroke();
                this.alignmentCoord = { x: lastPath.x, y: firstPath.y };
                //console.log('0');
                break;
            case 45:
                ctx.lineTo(firstPath.x + lengthX, firstPath.y + lengthX);
                ctx.stroke();
                this.alignmentCoord = { x: firstPath.x + lengthX, y: firstPath.y + lengthX };
                //console.log('45');

                break;
            case 90:
                ctx.lineTo(firstPath.x, lastPath.y);
                ctx.stroke();
                this.alignmentCoord = { x: firstPath.x, y: lastPath.y };
                //console.log('90');

                break;
            case 135:
                ctx.lineTo(firstPath.x - lengthX, firstPath.y + lengthX);
                ctx.stroke();
                this.alignmentCoord = { x: firstPath.x - lengthX, y: firstPath.y + lengthX };
                //console.log('135');

                break;
            case 180:
                ctx.lineTo(lastPath.x, firstPath.y);
                ctx.stroke();
                this.alignmentCoord = { x: lastPath.x, y: firstPath.y };
                //console.log('180');

                break;
            case 225:
                ctx.lineTo(firstPath.x - lengthX, firstPath.y - lengthX);
                ctx.stroke();
                this.alignmentCoord = { x: firstPath.x - lengthX, y: firstPath.y - lengthX };
                //console.log('225');

                break;
            case 270:
                ctx.lineTo(firstPath.x, lastPath.y);
                ctx.stroke();
                this.alignmentCoord = { x: firstPath.x, y: lastPath.y };
                //console.log('270');

                break;
            case 315:
                ctx.lineTo(firstPath.x + lengthX, firstPath.y - lengthX);
                ctx.stroke();
                this.alignmentCoord = { x: firstPath.x + lengthX, y: firstPath.y - lengthX };
                //console.log('315');
                break;
        }
    }

    roundToNearestAngle(angle: number): number {
        if (angle >= 337.5 || angle < 22.5) {
            return AlignmentAngle.right;
        } else if (angle >= 22.5 && angle < 67.5) {
            return AlignmentAngle.topRight;
        } else if (angle >= 67.5 && angle < 112.5) {
            return AlignmentAngle.top;
        } else if (angle >= 112.5 && angle < 157.5) {
            return AlignmentAngle.topLeft;
        } else if (angle >= 157.5 && angle < 202.5) {
            return AlignmentAngle.left;
        } else if (angle >= 202.5 && angle < 247.5) {
            return AlignmentAngle.bottomLeft;
        } else if (angle >= 247.5 && angle < 292.5) {
            return AlignmentAngle.bottom;
        } else if (angle >= 292.5 && angle < 337.5) {
            return AlignmentAngle.bottomRight;
        }
        return 1;
    }

    findAlignmentAngle(path: Vec2[]): number {
        const mouseMoveCoord = path[path.length - 1];
        const mouseDownCoord = path[0];
        const pointX = mouseMoveCoord.x - mouseDownCoord.x;
        const pointY = mouseMoveCoord.y - mouseDownCoord.y;

        let alignmentAngle: number;

        if (mouseMoveCoord.y <= mouseDownCoord.y) {
            alignmentAngle = Math.abs(360 - Math.abs(Math.atan2(pointY, pointX) * 180) / Math.PI);
            const roundedAngle = this.roundToNearestAngle(alignmentAngle);
            return roundedAngle;
        } else {
            alignmentAngle = Math.abs(Math.atan2(pointY, pointX) * 180) / Math.PI;
            const roundedAngle = this.roundToNearestAngle(alignmentAngle);
            return roundedAngle;
        }
    }

    private clearPath(): void {
        this.pathData = [];
    }
    private clearPathSaved(): void {
        this.pathDataSaved = [];
    }
}