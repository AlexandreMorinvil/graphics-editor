import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { DialogData } from '@app/classes/dialog-data';
import { ExportDrawingService } from '@app/services/export/export-drawing.service';

@Component({
    selector: 'app-modal-export',
    templateUrl: './modal-export.component.html',
    styleUrls: ['./modal-export.component.scss'],
})
export class ExportComponent {
    visible: boolean = true;
    drawName: FormControl = new FormControl('', Validators.required);
    constructor(
        public exportDrawingService: ExportDrawingService,
        public dialogRef: MatDialogRef<ExportComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        d: MatTabsModule,
        dialog: MatDialog,
    ) {}

    exportToPNG(): void {
        if (this.validateValue()) {
            (document.getElementById('buttonExportPNG') as HTMLInputElement).disabled = true;
            const drawName = this.drawName.value;
            const format: string = '.png';
            this.exportDrawingService.exportDraw(drawName, format);
        }
    }
    exportToJPG(): void {
        if (this.validateValue()) {
            (document.getElementById('buttonExportJPG') as HTMLInputElement).disabled = true;
            const drawName = this.drawName.value;
            const format: string = '.jpg';
            this.exportDrawingService.exportDraw(drawName, format);
        }
    }
    private validateValue(): boolean {
        return this.validateDrawName(this.drawName.value);
    }

    private validateDrawName(name: string): boolean {
        const noName = '';
        return name !== noName && name != undefined;
    }
}
