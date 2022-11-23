import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { CanDeactiveComponent, ChangesGuard } from './changes.guard';
import {
    VhoWorkHoursNonAvailabilityTableComponent
} from '../../work-allocation/edit-work-hours/vho-work-hours-non-availability-table/vho-work-hours-non-availability-table.component';

const activatedRouteSnapshot: ActivatedRouteSnapshot = new ActivatedRouteSnapshot();

describe('change-guard', () => {
    let changeGuard: ChangesGuard;
    let component: jasmine.SpyObj<VhoWorkHoursNonAvailabilityTableComponent>;
    component = jasmine.createSpyObj('CanDeactiveComponent', ['canDeactive']);

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ChangesGuard]
        }).compileComponents();
        changeGuard = TestBed.inject(ChangesGuard);
        const tmp = 1;
    });

    describe('when data are changed', () => {
        it('canDeactivate should return false', () => {
            component.canDeactive.and.returnValue(false);
            const result = changeGuard.canDeactivate(component, null);
            expect(result).toBeFalsy();
        });

        it('canDeactivate should return true', () => {
            component.canDeactive.and.returnValue(true);
            const result = changeGuard.canDeactivate(component, null);
            expect(result).toBeTruthy();
        });
    });
});
