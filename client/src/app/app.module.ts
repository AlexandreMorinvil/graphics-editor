import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './components/app/app.component';
import { AttributeColorPickerViewerComponent } from './components/attributes-panel/attribute-color-picker-viewer/attribute-color-picker-viewer.component';
// Attribute components
import { AttributeColorComponent } from './components/attributes-panel/attribute-color/attributes-color.component';
import { AttributeJunctionComponent } from './components/attributes-panel/attribute-junction/attributes-junction.component';
import { AttributeSelectionComponent } from './components/attributes-panel/attribute-selection/attribute-selection.component';
import { AttributeTextureComponent } from './components/attributes-panel/attribute-texture/attributes-texture.component';
import { AttributeTracingComponent } from './components/attributes-panel/attribute-tracing/attributes-tracing.component';
import { AttributeWidthComponent } from './components/attributes-panel/attribute-width/attributes-width.component';
import { AttributesPanelComponent } from './components/attributes-panel/attributes-panel.component';
import { AttributesSidesComponent } from './components/attributes-panel/attributes-sides/attributes-sides.component';
import { AttributesToleranceComponent } from './components/attributes-panel/attributes-tolerance/attributes-tolerance.component';
import { DrawingComponent } from './components/drawing/drawing.component';
import { EditorPageComponent } from './components/editor-page/editor-page.component';
import { MainPageComponent } from './components/main-page/main-page.component';
import { ExportComponent } from './components/modal/modal-export/modal-export.component';
import { SaveComponent } from './components/modal/modal-save/modal-save.component';
import { UserGuideModalComponent } from './components/modal/modal-user-guide/modal-user-guide.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TooltipComponent } from './components/tooltip/tooltip.component';
import { WorkspaceComponent } from './components/workspace/workspace.component';

@NgModule({
    declarations: [
        AppComponent,
        AttributesPanelComponent,
        AttributeJunctionComponent,
        AttributeTextureComponent,
        AttributeTracingComponent,
        AttributeWidthComponent,
        AttributeColorComponent,
        EditorPageComponent,
        ExportComponent,
        SidebarComponent,
        DrawingComponent,
        MainPageComponent,
        TooltipComponent,
        WorkspaceComponent,
        UserGuideModalComponent,
        AttributesSidesComponent,
        SaveComponent,
        AttributeColorPickerViewerComponent,
        AttributesToleranceComponent,
        AttributeSelectionComponent,
    ],

    exports: [MatChipsModule],

    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        MatDialogModule,
        MatChipsModule,
        MatFormFieldModule,
        FormsModule,
        MatInputModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatTabsModule,
    ],
    entryComponents: [ExportComponent, SaveComponent],
    providers: [{ provide: MAT_DIALOG_DATA, useValue: [] }],
    bootstrap: [AppComponent],
})
export class AppModule {}
