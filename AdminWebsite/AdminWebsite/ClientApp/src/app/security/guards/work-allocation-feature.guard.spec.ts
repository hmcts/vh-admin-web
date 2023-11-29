import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { FeatureFlags, LaunchDarklyService } from '../../services/launch-darkly.service';
import { WorkAllocationFeatureGuard } from './work-allocation-feature.guard';

describe('WorkAllocationFeatureGuard', () => {
    let workAllocationFeatureGuard: WorkAllocationFeatureGuard;

    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);

    const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    beforeEach(() => {
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.vhoWorkAllocation).and.returnValue(of(true));

        TestBed.configureTestingModule({
            providers: [
                WorkAllocationFeatureGuard,
                { provide: Router, useValue: routerSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy }
            ]
        }).compileComponents();
        workAllocationFeatureGuard = TestBed.inject(WorkAllocationFeatureGuard);
    });

    it('should return true if feature toggle is on', () => {
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.vhoWorkAllocation).and.returnValue(of(true));
        workAllocationFeatureGuard.canActivate(null, null).subscribe(result => {
            expect(result).toBeTruthy();
        });
    });

    it('should redirect to home page if feature toggle is off', () => {
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.vhoWorkAllocation).and.returnValue(of(false));
        workAllocationFeatureGuard.canActivate(null, null).subscribe(result => {
            expect(result).toBeFalsy();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
        });
    });
});
