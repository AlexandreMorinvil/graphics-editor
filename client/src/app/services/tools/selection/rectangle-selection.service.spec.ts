import { TestBed } from '@angular/core/testing';
import { InteractionSelection } from '@app/classes/action/interaction-selection';
import { canvasTestHelper } from '@app/classes/canvas-test-helper';
import { Vec2 } from '@app/classes/vec2';
import { DrawingService } from '@app/services/drawing/drawing.service';
import { ColorService } from '@app/services/tool-modifier/color/color.service';
import { TracingService } from '@app/services/tool-modifier/tracing/tracing.service';
import { WidthService } from '@app/services/tool-modifier/width/width.service';
import { RectangleService } from '@app/services/tools/rectangle/rectangle-service';
import { RectangleSelectionService } from './rectangle-selection.service';
// Illogical to seperate test in different file for the same service
// tslint:disable:max-file-line-count
describe('RectangleSelectionService', () => {
    // tslint:disable:no-any
    let service: RectangleSelectionService;
    let tracingService: TracingService;
    let colorService: ColorService;
    let widthService: WidthService;

    let baseCtxStub: CanvasRenderingContext2D;
    let previewCtxStub: CanvasRenderingContext2D;
    let canvasStub: HTMLCanvasElement;
    let mouseEventNotInCanvas: MouseEvent;
    let mouseEvent: MouseEvent;
    // tslint:disable-next-line:prefer-const
    const pathTest: Vec2[] = [
        { x: 10, y: 10 },
        { x: 11, y: 11 },
        { x: 12, y: 12 },
    ];
    let resetTransformSpy: jasmine.Spy<any>;
    let putImageDataSpy: jasmine.Spy<any>;
    let onMouseDownSpy: jasmine.Spy<any>;
    let onMouseUpSpy: jasmine.Spy<any>;
    let onMouseMoveSpy: jasmine.Spy<any>;
    let getSquaredSizeSpy: jasmine.Spy<any>;
    let clearPathSpy: jasmine.Spy<any>;
    let createOnMouseMoveEventSpy: jasmine.Spy<any>;
    let checkArrowUnhitSpy: jasmine.Spy<any>;
    let executeSpy: jasmine.Spy<any>;
    let onArrowDownSpy: jasmine.Spy<any>;
    let drawnAnchorSpy: jasmine.Spy<any>;
    let drawServiceSpy: jasmine.SpyObj<DrawingService>;
    let rectangleServiceSpy: jasmine.SpyObj<RectangleService>;
    beforeEach(() => {
        baseCtxStub = canvasTestHelper.canvas.getContext('2d') as CanvasRenderingContext2D;
        previewCtxStub = canvasTestHelper.drawCanvas.getContext('2d') as CanvasRenderingContext2D;
        canvasStub = canvasTestHelper.canvas;

        drawServiceSpy = jasmine.createSpyObj('DrawingService', ['clearCanvas']);
        rectangleServiceSpy = jasmine.createSpyObj('RectangleService', ['onMouseMove', 'drawRectangle', 'drawPreviewRect', 'onMouseDown']);

        TestBed.configureTestingModule({
            providers: [
                { provide: DrawingService, useValue: drawServiceSpy },
                { provide: RectangleService, useValue: rectangleServiceSpy },
            ],
        });
        service = TestBed.inject(RectangleSelectionService);
        tracingService = TestBed.inject(TracingService);
        colorService = TestBed.inject(ColorService);
        widthService = TestBed.inject(WidthService);

        resetTransformSpy = spyOn<any>(service, 'resetTransform').and.callThrough();
        putImageDataSpy = spyOn<any>(service, 'putImageData').and.callThrough();
        drawnAnchorSpy = spyOn<any>(service, 'drawnAnchor').and.callThrough();
        getSquaredSizeSpy = spyOn<any>(service as any, 'getSquaredSize').and.callThrough();
        onMouseDownSpy = spyOn<any>(service, 'onMouseDown').and.callThrough();
        onMouseUpSpy = spyOn<any>(service, 'onMouseUp').and.callThrough();
        onMouseMoveSpy = spyOn<any>(service, 'onMouseMove').and.callThrough();
        onArrowDownSpy = spyOn<any>(service, 'onArrowDown').and.callThrough();

        clearPathSpy = spyOn<any>(service, 'clearPath').and.callThrough();
        createOnMouseMoveEventSpy = spyOn<any>(service, 'createOnMouseMoveEvent').and.callThrough();
        checkArrowUnhitSpy = spyOn<any>(service, 'checkArrowUnhit').and.callThrough();
        executeSpy = spyOn<any>(service, 'execute').and.callThrough();

        const canvasWidth = 1000;
        const canvasHeight = 800;

        (service as any).tracingService = tracingService;
        (service as any).colorService = colorService;
        (service as any).widthService = widthService;
        (service as any).drawingService.baseCtx = baseCtxStub;
        (service as any).drawingService.previewCtx = previewCtxStub;
        (service as any).drawingService.canvas = canvasStub;
        (service as any).drawingService.canvas.width = canvasWidth;
        (service as any).drawingService.canvas.height = canvasHeight;

        (service as any).selectionCreated = false;
        (service as any).draggingImage = false;
        (service as any).mouseDown = false;
        (service as any).localMouseDown = false;
        (service as any).hasDoneFirstTranslation = false;
        (service as any).startDownCoord = { x: 0, y: 0 };
        (service as any).pathLastCoord = { x: 1, y: 1 };
        // Magic numbers are for testing purposes only
        // tslint:disable:no-magic-numbers
        (service as any).imageData = new ImageData(2, 2);
        (service as any).oldImageData = new ImageData(3, 3);
        (service as any).pathData = pathTest;

        mouseEventNotInCanvas = {
            offsetX: 2000,
            offsetY: 2000,
            button: 0,
            shiftKey: false,
        } as MouseEvent;

        mouseEvent = {
            offsetX: 25,
            offsetY: 25,
            button: 0,
            shiftKey: false,
        } as MouseEvent;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should be call resetTransform on mouse down,set attribute correctly and create a selection', () => {
        service.onMouseDown(mouseEvent);
        expect((service as any).arrowPress).toEqual([false, false, false, false]);
        expect((service as any).arrowDown).toBe(false);
        expect((service as any).mouseDownCoord).toEqual(service.getPositionFromMouse(mouseEvent));
        expect((service as any).mouseDown).toBeTrue();
        expect(resetTransformSpy).toHaveBeenCalled();
        expect((service as any).imageData).toEqual(new ImageData(1, 1));
        expect((service as any).startDownCoord).toEqual(service.getPositionFromMouse(mouseEvent));
        expect((service as any).pathData).toContain(service.getPositionFromMouse(mouseEvent));
        expect((service as any).startSelectionPoint).toEqual(service.getPositionFromMouse(mouseEvent));
        expect(onMouseDownSpy).toHaveBeenCalled();
    });
    it('should set attribute correctly and translate a selection on mouse down if selection created and hit selection return true', () => {
        (service as any).mouseDown = true;
        (service as any).localMouseDown = true;
        (service as any).selectionCreated = true;
        (service as any).hasDoneFirstTranslation = true;
        (service as any).startDownCoord = { x: 0, y: 0 };
        (service as any).pathLastCoord = { x: 10, y: 10 };
        // Magic numbers are for testing purposes only
        // tslint:disable:no-magic-numbers
        (service as any).oldImageData = new ImageData(10, 10);
        (service as any).imageData = new ImageData(100, 100);

        (service as any).pathData = pathTest;

        service.onMouseDown(mouseEvent);
        expect((service as any).draggingImage).toBeTrue();
        expect((service as any).pathData).toContain((service as any).pathLastCoord);
    });

    it('should set attribute correctly and translate a selection on mouse down if not first translation', () => {
        (service as any).mouseDown = true;
        (service as any).localMouseDown = true;
        (service as any).selectionCreated = true;
        (service as any).hasDoneFirstTranslation = false;
        (service as any).startDownCoord = { x: 0, y: 0 };
        (service as any).pathLastCoord = { x: 10, y: 10 };
        // Magic numbers are for testing purposes only
        // tslint:disable:no-magic-numbers
        (service as any).oldImageData = new ImageData(10, 10);
        (service as any).imageData = new ImageData(100, 100);

        (service as any).pathData = pathTest;

        service.onMouseDown(mouseEvent);
        expect((service as any).draggingImage).toBeTrue();
        expect((service as any).pathData).toContain((service as any).pathLastCoord);
    });

    it('should set attribute and translate a selection on mouse move if mouseDown and draggingImage are true on mouse move', () => {
        (service as any).draggingImage = true;
        (service as any).mouseDown = true;
        (service as any).localMouseDown = true;

        service.onMouseMove(mouseEvent);
        expect(drawServiceSpy.clearCanvas).toHaveBeenCalled();
        expect((service as any).startDownCoord).toEqual((service as any).evenImageStartCoord(service.getPositionFromMouse(mouseEvent)));
        expect(putImageDataSpy).toHaveBeenCalled();
    });

    it('should set attribute and translate a selection on mouse move if mouseDown is true and draggingImage is false with shift down', () => {
        (service as any).draggingImage = false;
        (service as any).mouseDown = true;
        (service as any).localMouseDown = true;
        (service as any).rectangleService.shiftDown = true;
        (service as any).startDownCoord = { x: 0, y: 0 };

        service.onMouseMove(mouseEvent);
        expect(rectangleServiceSpy.onMouseMove).toHaveBeenCalled();
        expect(getSquaredSizeSpy).toHaveBeenCalled();
    });
    it('should set attribute and translate a selection on mouse move if mouseDown is true and draggingImage is false with no shift', () => {
        (service as any).draggingImage = false;
        (service as any).mouseDown = true;
        (service as any).localMouseDown = true;
        (service as any).rectangleService.shiftDown = false;
        (service as any).startDownCoord = { x: 0, y: 0 };

        service.onMouseMove(mouseEvent);
        expect(rectangleServiceSpy.onMouseMove).toHaveBeenCalled();
        expect((service as any).pathData).toContain((service as any).getPositionFromMouse(mouseEvent));
    });
    it('should  do nothing if mouse move is not in canvas', () => {
        (service as any).draggingImage = false;
        (service as any).mouseDown = false;
        (service as any).localMouseDown = false;
        (service as any).rectangleService.shiftDown = false;
        (service as any).startDownCoord = { x: 0, y: 0 };

        service.onMouseMove(mouseEvent);
        expect((service as any).pathData).not.toContain((service as any).getPositionFromMouse(mouseEventNotInCanvas));
        expect(rectangleServiceSpy.onMouseMove).not.toHaveBeenCalled();
    });
    it('should set attribute and translate a selection on mouse up', () => {
        (service as any).draggingImage = true;
        (service as any).mouseDown = false;
        (service as any).localMouseDown = false;
        (service as any).startSelectionPoint = { x: 15, y: 15 };
        (service as any).startDownCoord = { x: 14, y: 14 };
        service.mouseDownCoord = { x: 1, y: 1 };
        // Magic numbers are for testing purposes only
        // tslint:disable:no-magic-numbers
        (service as any).imageData = new ImageData(10, 10);
        (service as any).pathLastCoord = { x: 10, y: 10 };
        (service as any).pathData = pathTest;
        service.onMouseUp(mouseEvent);

        expect(drawServiceSpy.clearCanvas).toHaveBeenCalled();
        expect(putImageDataSpy).toHaveBeenCalled();
        expect(drawnAnchorSpy).toHaveBeenCalled();
    });
    it('should set attribute and translate a selection on mouse up if mouse down is true and dragginImage is set to false', () => {
        (service as any).draggingImage = false;
        (service as any).mouseDown = true;
        (service as any).localMouseDown = true;
        (service as any).rectangleService.shiftDown = true;
        (service as any).startSelectionPoint = { x: 15, y: 15 };
        (service as any).startDownCoord = { x: 14, y: 14 };
        service.mouseDownCoord = { x: 1, y: 1 };
        // Magic numbers are for testing purposes only
        // tslint:disable:no-magic-numbers
        (service as any).imageData = new ImageData(10, 10);
        (service as any).pathLastCoord = { x: 10, y: 10 };
        (service as any).pathData = pathTest;
        service.onMouseUp(mouseEvent);
        expect(getSquaredSizeSpy).toHaveBeenCalled();
        expect(clearPathSpy).toHaveBeenCalled();
        expect(drawServiceSpy.clearCanvas).not.toHaveBeenCalled();
        expect(putImageDataSpy).not.toHaveBeenCalled();
        expect(drawnAnchorSpy).toHaveBeenCalled();
    });

    it('should set attribute and translate a selection on mouse up if mouse down is false and dragginImage is set to false', () => {
        (service as any).draggingImage = false;
        (service as any).mouseDown = false;
        (service as any).localMouseDown = false;
        (service as any).startSelectionPoint = { x: 15, y: 15 };
        (service as any).startDownCoord = { x: 14, y: 14 };
        service.mouseDownCoord = { x: 1, y: 1 };
        // Magic numbers are for testing purposes only
        // tslint:disable:no-magic-numbers
        (service as any).imageData = new ImageData(10, 10);
        (service as any).pathLastCoord = { x: 10, y: 10 };
        (service as any).pathData = pathTest;
        service.onMouseUp(mouseEvent);

        expect(drawServiceSpy.clearCanvas).not.toHaveBeenCalled();
        expect(putImageDataSpy).not.toHaveBeenCalled();
        expect(drawnAnchorSpy).not.toHaveBeenCalled();
    });

    it('should on shiftDown', () => {
        const keyboardEvent = {} as KeyboardEvent;
        service.onShiftDown(keyboardEvent);
        expect((service as any).rectangleService.shiftDown).toBeTrue();
        expect(createOnMouseMoveEventSpy).toHaveBeenCalled();
    });
    it('should on onShiftUp', () => {
        const keyboardEvent = {} as KeyboardEvent;
        service.onShiftUp(keyboardEvent);
        expect((service as any).rectangleService.shiftDown).toBeFalse();
        expect(createOnMouseMoveEventSpy).toHaveBeenCalled();
    });

    it('should enter if in onArrowDown is false and has done first translation', () => {
        const keyboardEvent = {} as KeyboardEvent;
        (service as any).startDownCoord = { x: 14, y: 14 };
        (service as any).pathLastCoord = { x: 10, y: 10 };
        (service as any).imageData = new ImageData(10, 10);
        (service as any).selectionCreated = true;
        (service as any).hasDoneFirstTranslation = true;
        (service as any).arrowDown = false;

        (service as any).rectangleService.pathData = pathTest;
        (service as any).arrowPress = [true, false, false, false];
        service.onArrowDown(keyboardEvent);
        expect(drawServiceSpy.clearCanvas).toHaveBeenCalled();
        expect(putImageDataSpy).toHaveBeenCalled();
    });
    it('should enter if in onArrowDown is false and has not done first translation', () => {
        const keyboardEvent = {} as KeyboardEvent;
        // Magic numbers are for testing purposes only
        // tslint:disable:no-magic-numbers
        (service as any).imageData = new ImageData(10, 10);
        (service as any).selectionCreated = true;
        (service as any).hasDoneFirstTranslation = false;
        (service as any).arrowDown = false;

        (service as any).rectangleService.pathData = pathTest;
        (service as any).arrowPress = [true, false, false, false];
        service.onArrowDown(keyboardEvent);
        expect(drawServiceSpy.clearCanvas).toHaveBeenCalled();
        expect(putImageDataSpy).not.toHaveBeenCalled();
    });
    it('should NOT enter if in onArrowDown and selectionCreated is set to false', () => {
        const keyboardEvent = {} as KeyboardEvent;
        (service as any).startDownCoord = { x: 14, y: 14 };
        (service as any).pathLastCoord = { x: 10, y: 10 };
        (service as any).imageData = new ImageData(10, 10);
        (service as any).selectionCreated = false;
        (service as any).hasDoneFirstTranslation = false;
        (service as any).arrowDown = true;

        (service as any).rectangleService.pathData = pathTest;
        (service as any).arrowPress = [true, false, false, false];
        service.onArrowDown(keyboardEvent);
        expect(drawServiceSpy.clearCanvas).not.toHaveBeenCalled();
        expect(putImageDataSpy).not.toHaveBeenCalled();
    });
    it('onArrowUp should enter if arrowPress is set to false and selectionCreated is set to true', () => {
        const keyboardEvent = {} as KeyboardEvent;
        (service as any).arrowPress = [false, false, false, false];
        (service as any).imageData = new ImageData(10, 10);
        (service as any).selectionCreated = true;
        (service as any).mouseDown = true;
        (service as any).localMouseDown = true;
        (service as any).pathData = pathTest;
        service.onArrowUp(keyboardEvent);
        expect((service as any).draggingImage).toBeFalse();
        expect((service as any).arrowDown).toBeFalse();

        expect(drawServiceSpy.clearCanvas).toHaveBeenCalled();
        expect(clearPathSpy).toHaveBeenCalled();
        expect(checkArrowUnhitSpy).toHaveBeenCalled();
        expect((service as any).pathLastCoord).toEqual({
            x: (service as any).startDownCoord.x + (service as any).imageData.width,
            y: (service as any).startDownCoord.y + (service as any).imageData.height,
        });
        expect((service as any).pathData).toContain((service as any).pathLastCoord);
        expect(drawnAnchorSpy).toHaveBeenCalled();
    });
    it('onArrowUp should not enter if arrowPress is set to true and selectionCreated is set to false', () => {
        const keyboardEvent = {} as KeyboardEvent;
        (service as any).arrowPress = [true, true, true, true];
        // Magic numbers are for testing purposes only
        // tslint:disable:no-magic-numbers
        (service as any).imageData = new ImageData(10, 10);
        (service as any).selectionCreated = false;
        (service as any).arrowDown = true;
        (service as any).mouseDown = true;
        (service as any).localMouseDown = true;
        (service as any).pathData = pathTest;
        service.onArrowUp(keyboardEvent);
        expect((service as any).arrowDown).not.toBeFalse();

        expect(drawServiceSpy.clearCanvas).not.toHaveBeenCalled();
        expect(clearPathSpy).not.toHaveBeenCalled();
        expect(checkArrowUnhitSpy).not.toHaveBeenCalled();
        expect((service as any).pathLastCoord).not.toEqual({
            x: (service as any).startDownCoord.x + (service as any).imageData.width,
            y: (service as any).startDownCoord.y + (service as any).imageData.height,
        });
        expect((service as any).pathData).not.toContain((service as any).pathLastCoord);
        expect(drawnAnchorSpy).not.toHaveBeenCalled();
    });
    it('onArrowUp should not enter if arrowPress is set to true and selectionCreated is set to true and arrow down set to true', () => {
        const keyboardEvent = {} as KeyboardEvent;
        (service as any).arrowPress = [true, true, true, true];
        (service as any).imageData = new ImageData(10, 10);
        (service as any).selectionCreated = true;
        (service as any).arrowDown = true;
        (service as any).mouseDown = true;
        (service as any).localMouseDown = true;
        (service as any).pathData = pathTest;
        service.onArrowUp(keyboardEvent);
        expect(onArrowDownSpy).toHaveBeenCalled();
    });
    it('onCtrlADown should assign values correctly', () => {
        service.onCtrlADown();
        expect((service as any).mouseDown).toBeFalse();
        expect((service as any).startDownCoord).toEqual({ x: 0, y: 0 });
        expect((service as any).rectangleService.mouseDownCoord).toEqual({ x: 0, y: 0 });
        expect(onMouseUpSpy).toHaveBeenCalled();
    });

    it('should on call on mouse move event if mouseDown is set to true for createOnMouseMoveEvent', () => {
        service.mouseDown = true;
        (service as any).localMouseDown = true;
        (service as any).startDownCoord = { x: 14, y: 14 };
        (service as any).rectangleService.shiftDown = true;
        (service as any).pathData = pathTest;
        (service as any).createOnMouseMoveEvent();
        expect(onMouseMoveSpy).toHaveBeenCalled();
    });
    it('should not call on mouse move event if mouseDown is set to false for createOnMouseMoveEvent', () => {
        service.mouseDown = false;
        (service as any).localMouseDown = false;
        (service as any).pathData = pathTest;

        (service as any).createOnMouseMoveEvent();
        expect(onMouseMoveSpy).not.toHaveBeenCalled();
    });
    it('should set correctly after resetTransform', () => {
        (service as any).resetTransform();
        expect(widthService.getWidth()).toEqual(1);
        expect(colorService.getPrimaryColor()).toEqual('#000000');
        expect(colorService.getSecondaryColor()).toEqual('#000000');
        expect(tracingService.getHasFill()).toEqual(false);
        expect(tracingService.getHasContour()).toEqual(true);
    });

    it('should start execute and put image data and clear canvas if has done first selection', () => {
        // Magic numbers are for testing purposes only
        // tslint:disable:no-magic-numbers
        const interaction = {
            hasDoneFirstSelection: true,
            startSelectionPoint: { x: 0, y: 0 },
            movePosition: { x: 1, y: 1 },
            selection: new ImageData(5, 5),
            belowSelection: new ImageData(3, 3),
        } as InteractionSelection;
        service.execute(interaction);
        expect(executeSpy).toHaveBeenCalled();
        expect(putImageDataSpy).toHaveBeenCalled();
    });
    it('should start execute and put image data and clear canvas if not done first selection', () => {
        // Magic numbers are for testing purposes only
        // tslint:disable:no-magic-numbers
        const interaction = {
            hasDoneFirstSelection: false,
            startSelectionPoint: { x: 0, y: 0 },
            movePosition: { x: 1, y: 1 },
            selection: new ImageData(5, 5),
            belowSelection: new ImageData(3, 3),
        } as InteractionSelection;
        service.execute(interaction);
        expect(executeSpy).toHaveBeenCalled();
        expect(putImageDataSpy).toHaveBeenCalled();
    });
});
