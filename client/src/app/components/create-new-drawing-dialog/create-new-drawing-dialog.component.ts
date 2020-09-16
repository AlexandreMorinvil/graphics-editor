import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
    animal: string;
    name: string;
}

@Component({
    selector: 'app-create-new-drawing-dialog',
    templateUrl: './create-new-drawing-dialog.component.html',
    styleUrls: ['./create-new-drawing-dialog.component.scss'],
})
export class CreateNewDrawingDialogComponent implements OnInit {
    constructor(public dialogRef: MatDialogRef<CreateNewDrawingDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

    onNoClick(): void {
        this.dialogRef.close();
    }

    ngOnInit(): void {}
}
