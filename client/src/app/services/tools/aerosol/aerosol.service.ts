import { Injectable } from '@angular/core';
import { InteractionPath } from '@app/classes/action/interaction-path';
import { Description } from '@app/classes/description';
import { MouseButton } from '@app/classes/mouse';
import { Tool } from '@app/classes/tool';
import { Vec2 } from '@app/classes/vec2';
import { DrawingStateTrackerService } from '@app/services/drawing-state-tracker/drawing-state-tracker.service';
import { DrawingService } from '@app/services/drawing/drawing.service';
import { ColorService } from '@app/services/tool-modifier/color/color.service';
import { NumberSprayTransmissionService } from '@app/services/tool-modifier/numberspraytransmission/numberspraytransmission.service';
import { SprayDiameterService } from '@app/services/tool-modifier/spraydiameter/spray-diameter.service';
import { SprayDropletDiameterService } from '@app/services/tool-modifier/spraydropletdiameter/spraydropletdiameter.service';

@Injectable({
    providedIn: 'root',
})
export class AerosolService extends Tool {
    private readonly NUMBER_MILLISECONDS_IN_SECOND: number = 1000;
    private readonly factorTimeIntervalBeetweenSpray: number = 100;
    private pathData: Vec2[];
    // tslint:disable:no-any
    private sprayIntervalId: any;
    private savedPathData: Vec2[];
    private sprayDropletDiameter: number;

    constructor(
        drawingService: DrawingService,
        private colorService: ColorService,
        private sprayService: SprayDiameterService,
        private sprayDropletService: SprayDropletDiameterService,
        private numberSprayTransmissionService: NumberSprayTransmissionService,
        private drawingStateTrackingService: DrawingStateTrackerService,
    ) {
        super(drawingService, new Description('aerosol', 'a', 'aerosol_icon.png'));
        this.modifiers.push(this.sprayService);
        this.modifiers.push(this.sprayDropletService);
        this.modifiers.push(this.numberSprayTransmissionService);
        this.modifiers.push(this.colorService);

        this.clearPath();
    }

    onMouseDown(event: MouseEvent): void {
        this.mouseDown = event.button === MouseButton.Left;
        if (this.mouseDown) {
            this.clearPath();
            this.mouseDownCoord = this.getPositionFromMouse(event);
            this.pathData.push(this.mouseDownCoord);
            this.sprayPaint(this.drawingService.baseCtx, this.pathData);
            this.sprayIntervalId = setInterval(
                () => this.wrapperSprayPaint(),
                this.NUMBER_MILLISECONDS_IN_SECOND / this.factorTimeIntervalBeetweenSpray,
            );
        }
    }

    wrapperSprayPaint(): void {
        this.sprayPaint(this.drawingService.baseCtx, this.pathData);
    }

    onMouseUp(event: MouseEvent): void {
        if (this.mouseDown) {
            const mousePosition = this.getPositionFromMouse(event);
            this.pathData.push(mousePosition);
        }
        clearInterval(this.sprayIntervalId);
        this.drawingStateTrackingService.addAction(this, new InteractionPath(this.savedPathData));
        this.mouseDown = false;
        this.clearPath();
    }

    onMouseMove(event: MouseEvent): void {
        if (this.mouseDown) {
            const mousePosition = this.getPositionFromMouse(event);
            this.pathData.push(mousePosition);
        }
    }

    private sprayPaint(ctx: CanvasRenderingContext2D, path: Vec2[]): void {
        this.setAttribute(ctx);
        const mouseMoveCoord: Vec2 = path[path.length - 1];
        if (this.isInCanvas(mouseMoveCoord)) {
            const xposition = mouseMoveCoord.x;
            const yposition = mouseMoveCoord.y;
            // tslint:disable:prefer-for-of
            const numberSprayTransmission = this.numberSprayTransmissionService.getNumberSprayTransmission() / this.factorTimeIntervalBeetweenSpray;
            for (let i = 0; i < numberSprayTransmission; i++) {
                ctx.beginPath();
                const sprayRadius = this.sprayService.getSprayDiameter() / 2;
                const randomAngle = Math.random() * (2 * Math.PI);
                const randomRadius = Math.random() * sprayRadius;
                const xvalueOffset = Math.cos(randomAngle) * randomRadius;
                const yvalueOffset = Math.sin(randomAngle) * randomRadius;
                const xValue = xposition + xvalueOffset;
                const yValue = yposition + yvalueOffset;
                this.sprayDropletDiameter = this.sprayDropletService.getSprayDropletDiameter();
                const dropletRadius = this.sprayDropletDiameter / 2;
                const savedData: Vec2 = { x: xValue, y: yValue }; // pour undo redo
                this.savedPathData.push(savedData); // pour undo redo
                ctx.arc(xValue, yValue, dropletRadius, 0, 2 * Math.PI, false);
                ctx.fill();
            }
        }
    }
    // tslint:disable:no-magic-numbers
    private setAttribute(ctx: CanvasRenderingContext2D): void {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5;
        ctx.fillStyle = this.colorService.getPrimaryColor();
        ctx.strokeStyle = this.colorService.getSecondaryColor();
        ctx.globalAlpha = this.colorService.getPrimaryColorOpacity();
        ctx.globalAlpha = this.colorService.getSecondaryColorOpacity();
    }

    private clearPath(): void {
        this.pathData = [];
        this.savedPathData = [];
    }

    private redoSprayPaint(ctx: CanvasRenderingContext2D, interaction: InteractionPath): void {
        this.setAttribute(this.drawingService.baseCtx);
        // tslint:disable:prefer-for-of
        for (let i = 0; i < interaction.path.length; i++) {
            this.drawingService.baseCtx.beginPath();
            this.drawingService.baseCtx.arc(
                interaction.path[i].x,
                interaction.path[i].y,
                this.sprayDropletService.getSprayDropletDiameter() / 2,
                0,
                2 * Math.PI,
                false,
            );
            this.drawingService.baseCtx.fill();
        }
    }

    execute(interaction: InteractionPath): void {
        this.redoSprayPaint(this.drawingService.baseCtx, interaction);
    }
}
