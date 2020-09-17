import { TestBed } from '@angular/core/testing';
import { canvasTestHelper } from '@app/classes/canvas-test-helper';
import { Vec2 } from '@app/classes/vec2';
import { DrawingService } from '@app/services/drawing/drawing.service';
import { RectangleService } from './rectangle-service';

describe('RectangleService', () => {
    let service: RectangleService;
    let mouseEvent: MouseEvent;
    let drawServiceSpy: jasmine.SpyObj<DrawingService>;

    let baseCtxStub: CanvasRenderingContext2D;
    let previewCtxStub: CanvasRenderingContext2D;
    let drawRectangleSpy: jasmine.Spy<any>;
    let setAttributeSpy: jasmine.Spy<any>;

    beforeEach(() => {
        baseCtxStub = canvasTestHelper.canvas.getContext('2d') as CanvasRenderingContext2D;
        previewCtxStub = canvasTestHelper.drawCanvas.getContext('2d') as CanvasRenderingContext2D;
        drawServiceSpy = jasmine.createSpyObj('DrawingService', ['clearCanvas']);
        TestBed.configureTestingModule({
            providers: [{ provide: DrawingService, useValue: drawServiceSpy }],
        });
        service = TestBed.inject(RectangleService);
        drawRectangleSpy = spyOn<any>(service, 'drawRectangle').and.callThrough();
        setAttributeSpy = spyOn<any>(service, 'setAttribute').and.callThrough();
        // Configuration du spy du service
        // tslint:disable:no-string-literal
        service['drawingService'].baseCtx = baseCtxStub; // Jasmine doesnt copy properties with underlying data
        service['drawingService'].previewCtx = previewCtxStub;

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

    it(' mouseDown should set mouseDownCoord to correct position', () => {
        const expectedResult: Vec2 = { x: 25, y: 25 };
        service.onMouseDown(mouseEvent);
        expect(service.mouseDownCoord).toEqual(expectedResult);
    });

    it(' mouseDown should set mouseDown property to true on left click', () => {
        service.onMouseDown(mouseEvent);
        expect(service.mouseDown).toEqual(true);
    });

    it(' mouseDown should set mouseDown property to false on right click', () => {
        const mouseEventRClick = {
            offsetX: 25,
            offsetY: 25,
            button: 1, // TODO: Avoir ceci dans un enum accessible
        } as MouseEvent;
        service.onMouseDown(mouseEventRClick);
        expect(service.mouseDown).toEqual(false);
    });

    it(' onMouseUp should call drawRectangle if mouse was already down', () => {
        service.mouseDownCoord = { x: 0, y: 0 };
        service.mouseDown = true;

        service.onMouseUp(mouseEvent);
        expect(drawRectangleSpy).toHaveBeenCalled();
    });

    it(' onMouseUp should not call drawRectangle if mouse was not already down', () => {
        service.mouseDown = false;
        service.mouseDownCoord = { x: 0, y: 0 };

        service.onMouseUp(mouseEvent);
        expect(drawRectangleSpy).not.toHaveBeenCalled();
    });

    it(' onMouseMove should call drawRectangle if mouse was already down', () => {
        service.mouseDownCoord = { x: 0, y: 0 };
        service.mouseDown = true;

        service.onMouseMove(mouseEvent);
        expect(drawServiceSpy.clearCanvas).toHaveBeenCalled();
        expect(drawRectangleSpy).toHaveBeenCalled();
    });

    it(' onMouseMove should not call drawRectangle if mouse was not already down', () => {
        service.mouseDownCoord = { x: 0, y: 0 };
        service.mouseDown = false;

        service.onMouseMove(mouseEvent);
        expect(drawServiceSpy.clearCanvas).not.toHaveBeenCalled();
        expect(drawRectangleSpy).not.toHaveBeenCalled();
    });

    it(' should call setAttribute when drawing rectangle on shift not pressed', () => {
        mouseEvent = { offsetX: 30, offsetY: 6, button: 0, shiftKey: false } as MouseEvent;
        service.onMouseDown(mouseEvent);
        mouseEvent = { offsetX: 10, offsetY: 5, button: 0, shiftKey: false } as MouseEvent;
        service.onMouseMove(mouseEvent);

        expect(drawServiceSpy.clearCanvas).toHaveBeenCalled();
        expect(setAttributeSpy).toHaveBeenCalled();
    });

    it(' should be a square  when drawing rectangle and shift pressed', () => {
        mouseEvent = { offsetX: 30, offsetY: 6, button: 0, shiftKey: true } as MouseEvent;
        service.onMouseDown(mouseEvent);
        mouseEvent = { offsetX: 10, offsetY: 5, button: 0, shiftKey: true } as MouseEvent;
        service.onMouseMove(mouseEvent);

        expect(drawServiceSpy.clearCanvas).toHaveBeenCalled();
        expect(mouseEvent.offsetX == mouseEvent.offsetY);
    });

    it(' should not be a square  when drawing rectangle and shift not pressed', () => {
        mouseEvent = { offsetX: 30, offsetY: 6, button: 0, shiftKey: false } as MouseEvent;
        service.onMouseDown(mouseEvent);
        mouseEvent = { offsetX: 10, offsetY: 5, button: 0, shiftKey: false } as MouseEvent;
        service.onMouseMove(mouseEvent);

        expect(drawServiceSpy.clearCanvas).toHaveBeenCalled();
        expect(mouseEvent.offsetX != mouseEvent.offsetY);
    });

    it(' should call setAttribute when type of Layout Full with the color green', () => {
        service.typeLayout = 'Full';
        service.primaryColor = 'green';
        service.setAttribute(baseCtxStub);
        expect(setAttributeSpy).toHaveBeenCalled();
        expect(baseCtxStub.fillStyle).toBe('#008000');
    });

    it(' should call setAttribute when type of Layout Contour with the color blue', () => {
        service.typeLayout = 'Contour';
        service.secondaryColor = 'blue';
        service.setAttribute(baseCtxStub);
        expect(setAttributeSpy).toHaveBeenCalled();
        expect(baseCtxStub.strokeStyle).toBe('#0000ff');
    });

    it(' should call setAttribute when type of Layout FullWithContour with the color blue for contour and red for fill ', () => {
        service.typeLayout = 'FullWithContour';
        service.primaryColor = 'red';
        service.secondaryColor = 'blue';
        service.setAttribute(baseCtxStub);
        expect(setAttributeSpy).toHaveBeenCalled();
        expect(baseCtxStub.strokeStyle).toBe('#0000ff');
        expect(baseCtxStub.fillStyle).toBe('#ff0000');
    });

    it(' should change the pixel of the canvas ', () => {
        mouseEvent = { offsetX: 0, offsetY: 0, button: 0 } as MouseEvent;
        service.onMouseDown(mouseEvent);
        mouseEvent = { offsetX: 1, offsetY: 0, button: 0 } as MouseEvent;
        service.onMouseUp(mouseEvent);

        // Premier pixel seulement
        const imageData: ImageData = baseCtxStub.getImageData(0, 0, 1, 1);
        expect(imageData.data[0]).toEqual(0); // R
        expect(imageData.data[1]).toEqual(0); // G
        expect(imageData.data[2]).toEqual(0); // B
        // tslint:disable-next-line:no-magic-numbers
        expect(imageData.data[3]).not.toEqual(0); // A
    });
});