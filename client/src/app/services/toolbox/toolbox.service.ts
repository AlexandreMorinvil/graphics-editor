import { Injectable } from '@angular/core';
import { Tool } from '@app/classes/tool';
import { DrawingService } from '@app/services/drawing/drawing.service';
import { AerosolService } from '@app/services/tools/aerosol/aerosol.service';
import { BrushService } from '@app/services/tools/brush/brush.service';
import { ColorPickerService } from '@app/services/tools/color-picker/color-picker.service';
import { CursorService } from '@app/services/tools/cursor/cursor.service';
import { EllipseService } from '@app/services/tools/ellipse/ellipse.service';
import { EraserService } from '@app/services/tools/eraser/eraser.service';
import { FeatherService } from '@app/services/tools/feather/feather.service';
import { GridService } from '@app/services/tools/grid/grid.service';
import { LineService } from '@app/services/tools/line/line.service';
import { PaintService } from '@app/services/tools/paint/paint.service';
import { PencilService } from '@app/services/tools/pencil/pencil.service';
import { PolygonService } from '@app/services/tools/polygon/polygon.service';
import { RectangleService } from '@app/services/tools/rectangle/rectangle.service';
import { EllipseSelectionService } from '@app/services/tools/selection/ellipse-selection.service';
import { MagicWandService } from '@app/services/tools/selection/magic-wand.service';
import { RectangleSelectionService } from '@app/services/tools/selection/rectangle-selection.service';
import { StampService } from '@app/services/tools/stamp/stamp.service';
import { TextService } from '@app/services/tools/text/text.service';

@Injectable({
    providedIn: 'root',
})
export class ToolboxService {
    private availableTools: Tool[] = [];
    private currentTool: Tool;

    constructor(
        cursorService: CursorService,
        gridService: GridService,
        pencilService: PencilService,
        brushService: BrushService,
        eraserService: EraserService,
        rectangleService: RectangleService,
        ellipseService: EllipseService,
        lineService: LineService,
        polygonService: PolygonService,
        colorPickerService: ColorPickerService,
        paintService: PaintService,
        stampService: StampService,
        rectangleSelectionService: RectangleSelectionService,
        ellipseSelectionService: EllipseSelectionService,
        aerosolService: AerosolService,
        magicWandService: MagicWandService,
        featherService: FeatherService,
        textService: TextService,
        private drawingService: DrawingService,
    ) {
        this.currentTool = cursorService;
        this.availableTools.push(cursorService);
        this.availableTools.push(gridService);
        this.availableTools.push(pencilService);
        this.availableTools.push(featherService);
        this.availableTools.push(brushService);
        this.availableTools.push(eraserService);
        this.availableTools.push(lineService);
        this.availableTools.push(rectangleService);
        this.availableTools.push(ellipseService);
        this.availableTools.push(polygonService);
        this.availableTools.push(rectangleSelectionService);
        this.availableTools.push(ellipseSelectionService);
        this.availableTools.push(magicWandService);
        this.availableTools.push(paintService);
        this.availableTools.push(textService);
        this.availableTools.push(stampService);
        this.availableTools.push(aerosolService);
        this.availableTools.push(colorPickerService);
    }

    getAvailableTools(): Tool[] {
        return this.availableTools;
    }

    getCurrentTool(): Tool {
        return this.currentTool;
    }

    setSelectedTool(selectedTool: Tool): void {
        if (this.currentTool instanceof EllipseSelectionService) (this.currentTool as EllipseSelectionService).drawOnBaseCanvas();
        if (this.currentTool instanceof RectangleSelectionService) (this.currentTool as RectangleSelectionService).drawOnBaseCanvas();
        if (this.currentTool instanceof MagicWandService) (this.currentTool as MagicWandService).drawOnBaseCanvas();
        if (this.currentTool instanceof TextService) (this.currentTool as TextService).confirm();

        this.currentTool = selectedTool;
        this.currentTool.mouseDown = false;
        this.drawingService.clearCanvas(this.drawingService.previewCtx);
        this.drawingService.clearCanvas(this.drawingService.selectionCtx);
    }
}
