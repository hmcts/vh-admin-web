import { fakeAsync, TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Data, Router, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { LastMinuteAmendmentsGuard } from './last-minute-amendments.guard';
import { VideoHearingsService } from '../services/video-hearings.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import { of } from 'rxjs';

describe('LastMinuteAmendmentsGuard', () => {
    let guard: LastMinuteAmendmentsGuard;
    const router = {
        navigate: jasmine.createSpy('navigate')
    };

    const videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>(['isConferenceClosed', 'isHearingAboutToStart']);
    const redirectPath = '/summary';
    const featureFlagServiceSpy = jasmine.createSpyObj<FeatureFlagService>('FeatureToggleService', ['getFeatureFlagByName']);
    featureFlagServiceSpy.getFeatureFlagByName.and.returnValue(of(true));

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                LastMinuteAmendmentsGuard,
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: Router, useValue: router },
                { provide: FeatureFlagService, useValue: featureFlagServiceSpy }
            ]
        }).compileComponents();
        guard = TestBed.inject(LastMinuteAmendmentsGuard);

        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
    });

    describe('when can activate', () => {
        it('should return true when not about to start', () => {
            videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        });

        it('should return true when conference is closed', () => {
            videoHearingsServiceSpy.isConferenceClosed.and.returnValue(true);
        });

        it('should return true when conference is closed and about to start', () => {
            videoHearingsServiceSpy.isConferenceClosed.and.returnValue(true);
            videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        });

        afterEach(() => {
            const returned = guard.canActivate(new ActivatedRouteSnapshot(), <RouterStateSnapshot>{ url: 'testUrl' });
            expect(returned).toBe(true);
            expect(router.navigate).not.toHaveBeenCalled();
        });
    });

    describe('when cannot activate', () => {
        it('canActivate should return true', () => {
            const returned = guard.canActivate(new ActivatedRouteSnapshot(), <RouterStateSnapshot>{ url: 'testUrl' });
            expect(returned).toBe(false);
            expect(router.navigate).toHaveBeenCalledWith([redirectPath]);
            expect(router.navigate).toHaveBeenCalledTimes(1);
        });
    });

    describe('when accessing assign-judge; last minute', () => {
        it('ejudFeature flag off should override last-minute-amendment-guard and block assign-judge url to be reach', () => {
            // setup
            guard.ejudFeatureFlag = false;
            const url = 'assign-judge';
            const dataSnapshot = { exceptionToRuleCheck: true } as Data;
            const urlSegmentArray = [{ path: url }] as UrlSegment[];
            // execute
            const returned = guard.canActivate(
                <ActivatedRouteSnapshot>{ url: urlSegmentArray, data: dataSnapshot },
                <RouterStateSnapshot>{ url: url }
            );
            // assert
            expect(returned).toBe(false);
            expect(router.navigate).toHaveBeenCalledWith([redirectPath]);
        });

        it('ejudFeature flag on should allow last-minute-amendment-guard and allow assign-judge url to be reached', () => {
            // setup
            const url = 'assign-judge';
            const dataSnapshot = { exceptionToRuleCheck: true } as Data;
            const urlSegmentArray = [{ path: url }] as UrlSegment[];
            // execute
            const returned = guard.canActivate(
                <ActivatedRouteSnapshot>{ url: urlSegmentArray, data: dataSnapshot },
                <RouterStateSnapshot>{ url: url }
            );
            // assert
            expect(returned).toBe(true);
        });
        afterEach(() => {
            guard.ejudFeatureFlag = true;
        });
    });
});
