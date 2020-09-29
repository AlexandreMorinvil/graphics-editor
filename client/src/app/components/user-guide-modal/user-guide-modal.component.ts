import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';

export interface DialogData {
    height: number;
    width: number;
}

@Component({
    selector: 'app-user-guide-modal',
    templateUrl: './user-guide-modal.component.html',
    styleUrls: ['./user-guide-modal.component.scss'],
})
export class UserGuideModalComponent implements OnInit {
    constructor(
        public dialogRef: MatDialogRef<UserGuideModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private router: Router,
        d: MatTabsModule,
    ) {}

    ngOnInit(): void {}

    onNoClick(): void {
        this.dialogRef.close();
    }

    navigateToEditor(): void {
        this.router.navigate(['editor']);
        this.dialogRef.close();
    }
}