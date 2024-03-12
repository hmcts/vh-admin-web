import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { FeatureFlags, LaunchDarklyService } from '../../services/launch-darkly.service';
import { ManageTeamFeatureGuard } from './manage-team-feature.guard';

describe('ManageTeamFeatureGuard', () => {
    let manageTeamFeatureGuard: ManageTeamFeatureGuard;

    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);

    const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    beforeEach(() => {
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.dom1Integration).and.returnValue(of(true));

        TestBed.configureTestingModule({
            providers: [
                ManageTeamFeatureGuard,
                { provide: Router, useValue: routerSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy }
            ]
        }).compileComponents();
        manageTeamFeatureGuard = TestBed.inject(ManageTeamFeatureGuard);
    });

    it('should return true if feature toggle is on', () => {
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.dom1Integration).and.returnValue(of(true));
        manageTeamFeatureGuard.canActivate(null, null).subscribe(result => {
            expect(result).toBeTruthy();
        });
    });

    it('should redirect to home page if feature toggle is off', () => {
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.dom1Integration).and.returnValue(of(false));
        manageTeamFeatureGuard.canActivate(null, null).subscribe(result => {
            expect(result).toBeFalsy();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
        });
    });
});
