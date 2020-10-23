import { Injectable } from '@angular/core';
import { Tool } from '@app/classes/tool';
import { BrushService } from '@app/services/tools/brush/brush-service';
import { ColorPickerService } from '@app/services/tools/color-picker/color-picker.service';
import { CursorService } from '@app/services/tools/cursor/cursor.service';
import { EllipseService } from '@app/services/tools/ellipse/ellipse-service';
import { EraserService } from '@app/services/tools/eraser/eraser-service';
import { LineService } from '@app/services/tools/line/line-service';
import { PaintService } from '@app/services/tools/paint/paint.service';
import { PencilService } from '@app/services/tools/pencil/pencil-service';
import { RectangleService } from '@app/services/tools/rectangle/rectangle-service';
import { SelectionToolService } from '@app/services/tools/selection/selection-tool.service';

@Injectable({
    providedIn: 'root',
})
export class ToolboxService {
    private availableTools: Tool[] = [];
    private currentTool: Tool;

    constructor(
        cursorService: CursorService,
        pencilService: PencilService,
        brushService: BrushService,
        eraserService: EraserService,
        rectangleService: RectangleService,
        ellipseService: EllipseService,
        lineService: LineService,
        colorPickerService: ColorPickerService,
        paintService: PaintService,
        selectioToolService: SelectionToolService,
    ) {
        this.currentTool = cursorService;
        this.availableTools.push(cursorService);
        this.availableTools.push(pencilService);
        this.availableTools.push(brushService);
        this.availableTools.push(eraserService);
        this.availableTools.push(lineService);
        this.availableTools.push(rectangleService);
        this.availableTools.push(ellipseService);
        this.availableTools.push(colorPickerService);
        this.availableTools.push(paintService);
        this.availableTools.push(selectioToolService);
    }

    getAvailableTools(): Tool[] {
        return this.availableTools;
    }

    getCurrentTool(): Tool {
        return this.currentTool;
    }

    setSelectedTool(selectedTool: Tool): void {
        this.currentTool = selectedTool;
    }
}
