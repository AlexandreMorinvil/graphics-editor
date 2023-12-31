import { TestBed } from '@angular/core/testing';
import { ToleranceModifierState } from './tolerance-state';
import { ToleranceService } from './tolerance.service';
// The disablement of the "any" tslint rule is justified in this situation as the prototype
// of the jasmine.Spy type takes a generic argument whose type is by convention of type "any"
// tslint:disable:no-any
describe('ToleranceService', () => {
    let service: ToleranceService;

    let setToleranceSpy: jasmine.Spy<any>;
    let getPixelToleranceSpy: jasmine.Spy<any>;
    let getPercentToleranceSpy: jasmine.Spy<any>;
    let setStateSpy: jasmine.Spy<any>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ToleranceService);
        setToleranceSpy = spyOn<any>(service, 'setTolerance').and.callThrough();
        getPixelToleranceSpy = spyOn<any>(service, 'getPixelTolerance').and.callThrough();
        getPercentToleranceSpy = spyOn<any>(service, 'getPercentTolerance').and.callThrough();
        setStateSpy = spyOn<any>(service, 'setState').and.callThrough();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it(' setTolerance should set tolerance to the incoming argument and getPercentTolerance/getPixelTolerance should equal the right number', () => {
        const tolerance = 25;
        service.setTolerance(tolerance);
        expect(setToleranceSpy).toHaveBeenCalled();
        expect(service.getPercentTolerance()).toEqual(tolerance);
        // We use magic number to calculate the convert the percentage limit in pixel
        // tslint:disable:no-magic-numbers
        expect(service.getPixelTolerance()).toEqual(Math.round((tolerance * 255) / 100));
        expect(getPercentToleranceSpy).toHaveBeenCalled();
        expect(getPixelToleranceSpy).toHaveBeenCalled();
    });

    it(' setWidth should set width to the 100 if input is above 100', () => {
        const tolerance = 101;
        const maxTolerance = service.MAX_TOLERANCE;
        service.setTolerance(tolerance);
        expect(setToleranceSpy).toHaveBeenCalled();
        expect(service.getPercentTolerance()).toEqual(maxTolerance);
        // We use magic number to calculate the convert the percentage limit in pixel
        // tslint:no-magic-numbers
        expect(service.getPixelTolerance()).toEqual(Math.round((maxTolerance * 255) / 100));
        expect(getPercentToleranceSpy).toHaveBeenCalled();
        expect(getPixelToleranceSpy).toHaveBeenCalled();
    });

    it(' setWidth should set width to 0 if input is below 0', () => {
        const tolerance = -1;
        const maxTolerance = service.MIN_TOLERANCE;
        service.setTolerance(tolerance);
        expect(setToleranceSpy).toHaveBeenCalled();
        expect(service.getPercentTolerance()).toEqual(maxTolerance);
        // We use magic number to calculate the convert the percentage limit in pixel
        // tslint:disable:no-magic-numbers
        expect(service.getPixelTolerance()).toEqual(Math.round((maxTolerance * 255) / 100));
        expect(getPercentToleranceSpy).toHaveBeenCalled();
        expect(getPixelToleranceSpy).toHaveBeenCalled();
    });

    it(' should call setState to the correct incoming argument ', () => {
        const state = {
            percentTolerance: 0,
            pixelTolerance: 0,
        } as ToleranceModifierState;
        service.setState(state);
        expect(setStateSpy).toHaveBeenCalled();
        expect(service.getPercentTolerance()).toEqual(state.percentTolerance);
        expect(service.getPixelTolerance()).toEqual(state.pixelTolerance);
    });
});
