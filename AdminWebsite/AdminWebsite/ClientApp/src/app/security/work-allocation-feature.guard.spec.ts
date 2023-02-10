import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import { LaunchDarklyService } from '../services/launch-darkly.service';
import { WorkAllocationFeatureGuard } from './work-allocation-feature.guard';

describe('WorkAllocationFeatureGuard', () => {
    let workAllocationFeatureGuard: WorkAllocationFeatureGuard;

    const launchDarklyServiceSpy = jasmine.createSpyObj('LaunchDarklyService', ['flagChange']);

    const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    beforeEach(() => {
        launchDarklyServiceSpy.flagChange = new ReplaySubject();

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
        launchDarklyServiceSpy.flagChange.next({ 'vho-work-allocation': true });
        workAllocationFeatureGuard.canActivate(null, null).subscribe(result => {
            expect(result).toBeTruthy();
        });
    });

    it('should redirect to home page if feature toggle is off', () => {
        launchDarklyServiceSpy.flagChange.next({ 'vho-work-allocation': false });
        workAllocationFeatureGuard.canActivate(null, null).subscribe(result => {
            expect(result).toBeFalsy();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
        });
    });
});
