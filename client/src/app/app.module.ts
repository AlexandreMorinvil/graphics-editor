import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './components/app/app.component';
import { AttributesPanelComponent } from './components/attributes-panel/attributes-panel.component';
import { DrawingComponent } from './components/drawing/drawing.component';
import { EditorPageComponent } from './components/editor-page/editor-page.component';
import { MainPageComponent } from './components/main-page/main-page.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { WorkspaceComponent } from './components/workspace/workspace.component'

@NgModule({
    declarations: [
        AppComponent,
        AttributesPanelComponent,
        EditorPageComponent, 
        SidebarComponent, 
        DrawingComponent, 
        MainPageComponent, 
        WorkspaceComponent
    ],
    imports: [BrowserModule, HttpClientModule, AppRoutingModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule { }
