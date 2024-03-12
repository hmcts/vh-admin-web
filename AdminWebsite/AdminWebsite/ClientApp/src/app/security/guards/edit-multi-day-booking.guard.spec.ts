import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { EditMultiDayBookingGuard } from './edit-multi-day-booking.guard';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { TestBed } from '@angular/core/testing';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { of } from 'rxjs';

describe('EditMultiDayBookingGuard', () => {
    let guard: EditMultiDayBookingGuard;

    const booking = new HearingModel();
    const videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>(['getCurrentRequest']);
    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);

    beforeEach(() => {
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));

        TestBed.configureTestingModule({
            providers: [
                EditMultiDayBookingGuard,
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy }
            ]
        }).compileComponents();
        guard = TestBed.inject(EditMultiDayBookingGuard);

        booking.isMultiDay = false;
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(booking);
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));
    });

    describe('canActivate', () => {
        describe('when booking is multi day', () => {
            beforeEach(() => {
                booking.isMultiDay = true;
            });

            it('should return false when multi day booking enhancements are enabled', () => {
                // Arrange
                guard.multiDayBookingEnhancementsEnabled = true;

                // Act & Assert
                guard.canActivate(null, null).subscribe(result => {
                    expect(result).toBeFalsy();
                });
            });

            it('should return true when multi day booking enhancements are disabled', () => {
                // Arrange
                guard.multiDayBookingEnhancementsEnabled = false;

                // Act & Assert
                guard.canActivate(null, null).subscribe(result => {
                    expect(result).toBeTruthy();
                });
            });
        });

        describe('when booking is not multi day', () => {
            beforeEach(() => {
                booking.isMultiDay = false;
            });

            it('should return true when multi day booking enhancements are enabled', () => {
                // Arrange
                guard.multiDayBookingEnhancementsEnabled = true;

                // Act & Assert
                guard.canActivate(null, null).subscribe(result => {
                    expect(result).toBeTruthy();
                });
            });

            it('should return true when multi day booking enhancements are disabled', () => {
                // Arrange
                guard.multiDayBookingEnhancementsEnabled = false;

                // Act & Assert
                guard.canActivate(null, null).subscribe(result => {
                    expect(result).toBeTruthy();
                });
            });
        });
    });
});
