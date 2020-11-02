import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { UserGuideModalComponent } from '@app/components/modal/modal-user-guide/modal-user-guide.component';

import { MainPageComponent } from './main-page.component';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    const dialogSpy: jasmine.SpyObj<MatDialog> = jasmine.createSpyObj('MatDialog', ['open']);
    // tslint:disable-next-line: no-any
    const dialogRefSpy: jasmine.SpyObj<MatDialogRef<MainPageComponent, any>> = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogSpy.open.and.returnValue(dialogRefSpy);

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [RouterTestingModule, HttpClientModule],
                declarations: [MainPageComponent, UserGuideModalComponent],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: {} },
                    { provide: MatDialogRef, useValue: {} },
                    { provide: MatDialog, useValue: dialogSpy },
                ],
            }).compileComponents();
        }),
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open Guide', () => {
        component.openUserGuide();
        expect(dialogSpy.open).toHaveBeenCalled();
    });
});
