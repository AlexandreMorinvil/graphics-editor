import { Component } from '@angular/core';
import { JunctionService } from '@app/services/tool-modifier/junction/junction.service';

@Component({
    selector: 'app-attributes-junction',
    templateUrl: './attributes-junction.component.html',
    styleUrls: ['./attributes-junction.component.scss', '../attributes-section.component.scss'],
})
export class AttributeJunctionComponent {
    diameter: number;
    hasJunctionPoint: boolean;

    constructor(private junctionService: JunctionService) {
        this.diameter = this.junctionService.getDiameter();
        this.hasJunctionPoint = this.junctionService.getHasJunctionPoint();
    }

    getMaxValue(): number {
        return this.junctionService.MAX_JUNCTION_DIAMETER;
    }

    getMinValue(): number {
        return this.junctionService.MIN_JUNCTION_DIAMETER;
    }

    assign(): void {
        this.junctionService.setDiameter(this.diameter);
        this.junctionService.setHasJunctionPoint(this.hasJunctionPoint);
    }

    revert(): void {
        this.diameter = this.junctionService.getDiameter();
        this.hasJunctionPoint = this.junctionService.getHasJunctionPoint();
    }

    needConfirmation(): boolean {
        const IS_DIAMETER_CHANGED: boolean = this.diameter !== this.junctionService.getDiameter();
        const HAS_JUNCTION_POINT_CHANGED: boolean = this.hasJunctionPoint !== this.junctionService.getHasJunctionPoint();
        return IS_DIAMETER_CHANGED || HAS_JUNCTION_POINT_CHANGED;
    }
}
