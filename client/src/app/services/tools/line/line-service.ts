import { Injectable } from '@angular/core';
import { Tool } from '@app/classes/tool';
import { Vec2 } from '@app/classes/vec2';
import { DrawingService } from '@app/services/drawing/drawing.service';

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

    private width: number = 1;
    private startPosition: Vec2;
    private endPosition: Vec2;
    private countClick: number;
    private click: number;
    private timer: number;
    private undo: ImageData[];
    private undoLimit: number = 24;
    private savedData: ImageData;
    alignmentCoord: Vec2;

    constructor(drawingService: DrawingService) {
        super(drawingService, 'ligne', 'l');
        this.clearPath();
        this.clearPathSaved();
        this.countClick = 0;
        this.click = 0;
        this.timer = 0;
        this.undo = [];
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
        } else if (event.shiftKey && this.mouseClick) {
            this.drawingService.clearCanvas(this.drawingService.previewCtx);

            this.pathData.push(mousePosition);
            this.drawAlignLine(this.drawingService.previewCtx, this.pathData);
        }
    }

    /* onShiftDown() {
        this.drawingService.clearCanvas(this.drawingService.previewCtx);
        this.drawAlignLine(this.drawingService.previewCtx, this.pathData);
    } */
    /* onShiftUp() {
        this.drawingService.clearCanvas(this.drawingService.previewCtx);
        this.drawLine(this.drawingService.previewCtx, this.pathData);
    } */

    onBackspaceDown(): void {
        if (this.undo.length > 0) {
        }
        this.drawingService.baseCtx.putImageData(this.undo[this.undo.length - 2], 0, 0);
        this.undo.pop();
        this.clearPath();
    }

    onEscapeDown(): void {
        this.mouseClick = false;
        this.drawingService.clearCanvas(this.drawingService.previewCtx);
        this.clearPath();
        console.log('Escape was pressed!!!');
    }

    onMouseClick(event: MouseEvent): void {
        this.mouseClick = event.button === MouseButton.Left;
        if (this.mouseClick) {
            this.countClick++;
            this.click++;
            if (this.click == 1 && !event.shiftKey) {
                this.mouseDownCoord = this.getPositionFromMouse(event);
                this.pathData.push(this.mouseDownCoord);
                this.drawLine(this.drawingService.baseCtx, this.pathData);
                this.initialiseStartAndEndPoint();
                this.savedData = this.drawingService.baseCtx.getImageData(0, 0, this.drawingService.canvas.width, this.drawingService.canvas.height);
                if (this.undo.length >= this.undoLimit) {
                    this.undo.shift();
                }
                this.undo.push(this.savedData);

                this.clearPath();
            }

            if (this.click == 1 && event.shiftKey) {
                //this.mouseDownCoord = this.getPositionFromMouse(event);
                //this.pathData.push(this.mouseDownCoord);
                this.drawAlignLine(this.drawingService.baseCtx, this.pathData);
                this.clearPath();
                this.pathData[0] = this.alignmentCoord;
                this.initialiseStartAndEndPoint();
                this.savedData = this.drawingService.baseCtx.getImageData(0, 0, this.drawingService.canvas.width, this.drawingService.canvas.height);
                if (this.undo.length >= this.undoLimit) {
                    this.undo.shift();
                }
                this.undo.push(this.savedData);
            }

            if (this.click === 1) {
                this.timer = setTimeout(() => {
                    this.click = 0;
                    console.log('click');
                }, 200);
            } else if (this.click === 2 && !event.shiftKey) {
                clearTimeout(this.timer);
                this.click = 0;
                this.onMouseDoubleClickEvent(event);
            }
        }
    }

    private onMouseDoubleClickEvent(event: MouseEvent): void {
        this.mouseClick = false;
        console.log('doubleClick');
        this.clearPath();
        if (this.isAround20Pixels()) {
            this.drawingService.baseCtx.beginPath();
            let firstPath = this.pathDataSaved[0];
            let lastPath = this.pathDataSaved[this.pathDataSaved.length - 1];
            this.drawingService.baseCtx.moveTo(firstPath.x, firstPath.y);
            this.drawingService.baseCtx.lineTo(lastPath.x, lastPath.y);

            this.drawingService.baseCtx.lineWidth = this.width; //width ajustment
            this.drawingService.baseCtx.stroke();
        }
        this.clearPathSaved();
        this.countClick = 0;
        this.click = 0;
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

        ctx.lineWidth = this.width; //width ajustment
        ctx.stroke();
    }
    private isAround20Pixels(): boolean {
        let diffXPosition = this.endPosition.x - this.pathDataSaved[0].x;
        let diffYPosition = this.endPosition.y - this.pathDataSaved[0].y;
        let xSideTriangleSquared = Math.pow(diffXPosition, 2);
        let ySideTriangleSquared = Math.pow(diffYPosition, 2);
        let hypothenus = Math.sqrt(xSideTriangleSquared + ySideTriangleSquared);
        console.log(hypothenus + ' hypothenus');
        if (hypothenus <= 200) {
            // on est en bas de 20 pixels
            return true;
        }
        return false;
    }

    private initialiseStartAndEndPoint(): void {
        if (this.countClick == 1) {
            //first click
            this.startPosition = this.mouseDownCoord;

            this.pathDataSaved.push(this.startPosition);
        } else if (this.countClick == 2) {
            //second click
            this.endPosition = this.mouseDownCoord;

            this.pathDataSaved.push(this.endPosition);
        } else {
            //others click
            this.startPosition = this.endPosition;

            this.endPosition = this.mouseDownCoord;

            this.pathDataSaved.push(this.startPosition);
            this.pathDataSaved.push(this.endPosition);
        }
    }
    drawAlignLine(ctx: CanvasRenderingContext2D, path: Vec2[]): void {
        ctx.beginPath();
        const alignmentAngle = this.findAlignmentAngle(path);
        const firstPath = path[0];
        const lastPath = path[path.length - 1];
        const lengthX = Math.abs(lastPath.x - firstPath.x);

        ctx.moveTo(firstPath.x, firstPath.y);
        ctx.lineWidth = this.width; //width ajustment

        switch (alignmentAngle) {
            case 0:
                ctx.lineTo(lastPath.x, firstPath.y);
                ctx.stroke();
                this.alignmentCoord = { x: lastPath.x, y: firstPath.y };
                console.log('0');
                break;
            case 45:
                ctx.lineTo(firstPath.x + lengthX, firstPath.y + lengthX);
                ctx.stroke();
                this.alignmentCoord = { x: firstPath.x + lengthX, y: firstPath.y + lengthX };
                console.log('45');

                break;
            case 90:
                ctx.lineTo(firstPath.x, lastPath.y);
                ctx.stroke();
                this.alignmentCoord = { x: firstPath.x, y: lastPath.y };
                console.log('90');

                break;
            case 135:
                ctx.lineTo(firstPath.x - lengthX, firstPath.y + lengthX);
                ctx.stroke();
                this.alignmentCoord = { x: firstPath.x - lengthX, y: firstPath.y + lengthX };
                console.log('135');

                break;
            case 180:
                ctx.lineTo(lastPath.x, firstPath.y);
                ctx.stroke();
                this.alignmentCoord = { x: lastPath.x, y: firstPath.y };
                console.log('180');

                break;
            case 225:
                ctx.lineTo(firstPath.x - lengthX, firstPath.y - lengthX);
                ctx.stroke();
                this.alignmentCoord = { x: firstPath.x - lengthX, y: firstPath.y - lengthX };
                console.log('225');

                break;
            case 270:
                ctx.lineTo(firstPath.x, lastPath.y);
                ctx.stroke();
                this.alignmentCoord = { x: firstPath.x, y: lastPath.y };
                console.log('270');

                break;
            case 315:
                ctx.lineTo(firstPath.x + lengthX, firstPath.y - lengthX);
                ctx.stroke();
                this.alignmentCoord = { x: firstPath.x + lengthX, y: firstPath.y - lengthX };
                console.log('315');
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
        //console.log('mouseMoveCoord x:' + mouseMoveCoord.x + ' y:' + mouseMoveCoord.y);
        //console.log('mouseDownCoord x: ' + mouseDownCoord.x + ' y: ' + mouseDownCoord.y);

        const pointX = mouseMoveCoord.x - mouseDownCoord.x;
        const pointY = mouseMoveCoord.y - mouseDownCoord.y;

        let alignmentAngle: number;

        if (mouseMoveCoord.y <= mouseDownCoord.y) {
            alignmentAngle = Math.abs(360 - Math.abs(Math.atan2(pointY, pointX) * 180) / Math.PI);
            //console.log(alignmentAngle);
            const roundedAngle = this.roundToNearestAngle(alignmentAngle);
            return roundedAngle;
        } else {
            alignmentAngle = Math.abs(Math.atan2(pointY, pointX) * 180) / Math.PI;
            //console.log(alignmentAngle);

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
