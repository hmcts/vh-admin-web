import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Data, Router, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { LastMinuteAmendmentsGuard } from './last-minute-amendments.guard';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { Logger } from '../../services/logger';

describe('LastMinuteAmendmentsGuard', () => {
    let guard: LastMinuteAmendmentsGuard;
    const router = {
        navigate: jasmine.createSpy('navigate')
    };

    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['warn', 'debug']);
    const videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>(['isConferenceClosed', 'isHearingAboutToStart']);
    const redirectPath = '/summary';

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                LastMinuteAmendmentsGuard,
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: Router, useValue: router },
                { provide: Logger, useValue: loggerSpy }
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
});
