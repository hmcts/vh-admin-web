import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { Logger } from '../services/logger';
import { LaunchDarklyService } from '../services/launch-darkly.service';
import { WorkAllocationFeatureGuard } from './work-allocation-feature.guard';

describe('WorkAllocationFeatureGuard', () => {
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);

    let workAllocationFeatureGuard: WorkAllocationFeatureGuard;

    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    launchDarklyServiceSpy = jasmine.createSpyObj('LaunchDarklyService', ['flagChange']);
    launchDarklyServiceSpy.flagChange = new BehaviorSubject({ 'vho-work-allocation': false });

    const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                WorkAllocationFeatureGuard,
                { provide: Router, useValue: routerSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();
        workAllocationFeatureGuard = TestBed.inject(WorkAllocationFeatureGuard);
    });

    it('should return true if feature toggle is on', () => {
        launchDarklyServiceSpy.flagChange.next({ 'vho-work-allocation': true });
        workAllocationFeatureGuard.canActivate(null, null).subscribe((result) => {
            expect(result).toBeTruthy();
        });
    });

    it('should redirect to home page if feature toggle is off', () => {
        launchDarklyServiceSpy.flagChange.next({ 'vho-work-allocation': false });
        workAllocationFeatureGuard.canActivate(null, null).subscribe((result) => {
            expect(result).toBeFalsy();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
        });
    });
});
