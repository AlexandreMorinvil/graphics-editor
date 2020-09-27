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
    private savedImage: ImageData;
    private countCurrentLigne: number;
    private isCloseShape: boolean;

    constructor(drawingService: DrawingService) {
        super(drawingService, 'ligne', 'l');
        this.clearPath();
        this.clearPathSaved();
        this.countClick = 0;
        this.click = 0;
        this.timer = 0;
        this.undo = [];
        this.countCurrentLigne = 0;
    }

    onMouseMove(event: MouseEvent): void {
        if (this.mouseClick) {
            const mousePosition = this.getPositionFromMouse(event);

            if (this.isInCanvas(mousePosition)) {
                this.drawingService.clearCanvas(this.drawingService.previewCtx);
                this.pathData[0] = this.mouseDownCoord;
                this.pathData.push(mousePosition);
                console.log('dessine');
                this.drawLine(this.drawingService.previewCtx, this.pathData);
                // On dessine sur le canvas de prévisualisation et on l'efface à chaque déplacement de la souris
            } else {
                this.drawingService.clearCanvas(this.drawingService.previewCtx);
                this.clearPath();
            }
        }
    }

    onBackspaceDown(): void {
        if (this.undo.length > 1) {
            this.clearPath();
            this.pathDataSaved.pop();
            this.pathDataSaved.pop();
            this.drawingService.clearCanvas(this.drawingService.previewCtx);
            this.mouseDownCoord = this.pathDataSaved[this.pathDataSaved.length - 1];
            this.drawingService.baseCtx.putImageData(this.undo[this.undo.length - 2], 0, 0);
            this.undo.pop();
            console.log('Backspace is pressed!!!');
            //console.log(this.undo.length);
        }
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
            if (this.click == 1) {
                console.log('dessine une ligne');
                this.mouseDownCoord = this.getPositionFromMouse(event);
                this.pathData.push(this.mouseDownCoord);
                this.drawLine(this.drawingService.baseCtx, this.pathData);
                this.initialiseStartAndEndPoint();
                this.savedImage = this.drawingService.baseCtx.getImageData(0, 0, this.drawingService.canvas.width, this.drawingService.canvas.height);
                this.undo.push(this.savedImage);
                this.clearPath();
            }
            if (this.click === 1) {
                this.timer = setTimeout(() => {
                    this.click = 0;
                    console.log('click');
                }, 200);
            } else if (this.click === 2) {
                clearTimeout(this.timer);
                this.click = 0;
                this.onMouseDoubleClickEvent(event);
            }
        }
    }

    private onMouseDoubleClickEvent(event: MouseEvent): void {
        this.countClick = 0;
        this.mouseClick = false;
        console.log('doubleClick');
        this.clearPath();
        this.drawingService.clearCanvas(this.drawingService.previewCtx);
        if (this.isAround20Pixels()) {
            console.log('pass');
            this.closeShape();
        }
        this.countCurrentLigne = 0;
        if (this.isCloseShape) {
            this.savedImage = this.drawingService.baseCtx.getImageData(0, 0, this.drawingService.canvas.width, this.drawingService.canvas.height);
            this.undo.push(this.savedImage);
            this.isCloseShape = false;
        }
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
        let fisrtCurrentPoint = this.pathDataSaved[this.pathDataSaved.length - this.countCurrentLigne * 2];
        let diffXPosition = this.endPosition.x - fisrtCurrentPoint.x;
        let diffYPosition = this.endPosition.y - fisrtCurrentPoint.y;
        let xSideTriangleSquared = Math.pow(diffXPosition, 2);
        let ySideTriangleSquared = Math.pow(diffYPosition, 2);
        let hypothenus = Math.sqrt(xSideTriangleSquared + ySideTriangleSquared);
        console.log(hypothenus + ' hypothenus');
        if (hypothenus <= 200) {
            // on est en bas de 200 pixels
            return true;
        }
        return false;
    }

    private closeShape(): void {
        this.isCloseShape = true;
        this.drawingService.baseCtx.beginPath();
        let firstPath = this.pathDataSaved[this.pathDataSaved.length - this.countCurrentLigne * 2];
        let lastPath = this.pathDataSaved[this.pathDataSaved.length - 1];
        this.drawingService.baseCtx.moveTo(firstPath.x, firstPath.y);
        this.drawingService.baseCtx.lineTo(lastPath.x, lastPath.y);

        this.drawingService.baseCtx.lineWidth = this.width; //width ajustment
        this.drawingService.baseCtx.stroke();
        this.drawingService.previewCtx.closePath();
    }

    private initialiseStartAndEndPoint(): void {
        if (this.countClick == 1) {
            //first click
            this.startPosition = this.mouseDownCoord;
            console.log(this.startPosition.x);
            console.log(this.startPosition.y);
            this.pathDataSaved.push(this.startPosition);
        } else if (this.countClick == 2) {
            //second click
            this.endPosition = this.mouseDownCoord;
            console.log(this.endPosition.x);
            console.log(this.endPosition.y);
            this.pathDataSaved.push(this.endPosition);
            this.countCurrentLigne++;
            console.log(this.countCurrentLigne);
        } else {
            //others click
            this.startPosition = this.endPosition;
            console.log(this.startPosition.x);
            console.log(this.startPosition.y);
            this.endPosition = this.mouseDownCoord;
            console.log(this.endPosition.x);
            console.log(this.endPosition.y);
            this.pathDataSaved.push(this.startPosition);
            this.pathDataSaved.push(this.endPosition);
            this.countCurrentLigne++;
            console.log(this.countCurrentLigne);
        }
    }

    private clearPath(): void {
        this.pathData = [];
    }
    private clearPathSaved(): void {
        this.pathDataSaved = [];
    }
}
