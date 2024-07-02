import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { CaseModel } from '../../common/model/case.model';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { BookingService } from '../../services/booking.service';
import { BookingPersistService } from '../../services/bookings-persist.service';
import {
    AllocatedCsoResponse,
    BookingStatus,
    HearingDetailsResponse,
    JusticeUserResponse,
    PhoneConferenceResponse,
    UpdateBookingStatusResponse,
    UserProfileResponse
} from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { UserIdentityService } from '../../services/user-identity.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { PageUrls } from '../../shared/page-url.constants';
import { BookingDetailsComponent } from './booking-details.component';
import { BookingStatusService } from 'src/app/services/booking-status-service';
import { HearingRoleCodes } from '../../common/model/hearing-roles.model';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';

let component: BookingDetailsComponent;
let videoHearingServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let routerSpy: jasmine.SpyObj<Router>;
let returnUrlServiceSpy: jasmine.SpyObj<ReturnUrlService>;
let bookingServiceSpy: jasmine.SpyObj<BookingService>;
let bookingPersistServiceSpy: jasmine.SpyObj<BookingPersistService>;
let userIdentityServiceSpy: jasmine.SpyObj<UserIdentityService>;

export class BookingDetailsTestData {
    getBookingsDetailsModel() {
        return new BookingsDetailsModel(
            '44',
            new Date('2019-11-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            '',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            true,
            'reason',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );
    }

    getParticipants() {
        const participants: Array<ParticipantDetailsModel> = [];
        const judges: Array<ParticipantDetailsModel> = [];
        const p1 = new ParticipantDetailsModel(
            '1',
            'Mrs',
            'Alan',
            'Brake',
            'Judge',
            'email.p1@hmcts.net',
            'email1@hmcts.net',
            'Applicant',
            'Representative',
            HearingRoleCodes.Representative,
            'Alan Brake',
            '',
            'ABC Solicitors',
            'Respondent',
            '12345678',
            'interpretee',
            false,
            null
        );
        const p2 = new ParticipantDetailsModel(
            '2',
            'Mrs',
            'Roy',
            'Bark',
            'Citizen',
            'email.p2@hmcts.net',
            'email2@hmcts.net',
            'Applicant',
            'Litigant in person',
            HearingRoleCodes.Applicant,
            'Roy Bark',
            '',
            'ABC Solicitors',
            'Respondent',
            '12345678',
            'interpretee',
            false,
            null
        );
        const p3 = new ParticipantDetailsModel(
            '2',
            'Mrs',
            'Fill',
            'Green',
            'Professional',
            'email.p3@hmcts.net',
            'email3@hmcts.net',
            'Respondent',
            'Litigant in person',
            HearingRoleCodes.Respondent,
            'Fill',
            '',
            'ABC Solicitors',
            'Respondent',
            '12345678',
            'interpretee',
            false,
            null
        );
        participants.push(p2);
        participants.push(p3);
        judges.push(p1);
        return { judges: judges, participants: participants };
    }

    getEndpoints() {
        const endpoints: EndpointModel[] = [];
        let endpoint = new EndpointModel();
        endpoint.displayName = 'Courtroom 001';
        endpoints.push(endpoint);
        endpoint = new EndpointModel();
        endpoint.displayName = 'Courtroom 002';
        endpoints.push(endpoint);
        return endpoints;
    }
}

const hearingResponse = new HearingDetailsResponse();
let allocatedCsoResponse = new AllocatedCsoResponse();

const caseModel = new CaseModel();
caseModel.name = 'X vs Y';
caseModel.number = 'XX3456234565';
const hearingModel = new HearingModel();
hearingModel.hearing_id = '44';
hearingModel.cases = [caseModel];
hearingModel.scheduled_duration = 120;
let now = new Date();
now.setMonth(now.getMonth());
now = new Date(now);
hearingModel.scheduled_date_time = now;
hearingModel.audio_recording_required = true;

const cancel_reason = 'Online abandonment (incomplete registration)';
class BookingDetailsServiceMock {
    mapBooking(response) {
        return new BookingDetailsTestData().getBookingsDetailsModel();
    }

    mapBookingParticipants() {
        return new BookingDetailsTestData().getParticipants();
    }

    mapBookingEndpoints(response) {
        return new BookingDetailsTestData().getEndpoints();
    }
}

describe('BookingDetailsComponent', () => {
    videoHearingServiceSpy = jasmine.createSpyObj('VideoHearingService', [
        'getHearingById',
        'saveHearing',
        'mapHearingDetailsResponseToHearingModel',
        'updateHearingRequest',
        'cancelBooking',
        'getCurrentRequest',
        'getTelephoneConferenceId',
        'getConferencePhoneNumber',
        'isHearingAboutToStart',
        'isConferenceClosed',
        'getAllocatedCsoForHearing',
        'rebookHearing',
        'getStatus',
        'cancelMultiDayBooking'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    bookingServiceSpy = jasmine.createSpyObj('BookingService', [
        'setEditMode',
        'resetEditMode',
        'setExistingCaseType',
        'removeExistingCaseType'
    ]);
    bookingPersistServiceSpy = jasmine.createSpyObj('BookingPersistService', ['selectedHearingId']);
    userIdentityServiceSpy = jasmine.createSpyObj('UserIdentityService', ['getUserInformation']);
    const loggerSpy: jasmine.SpyObj<Logger> = jasmine.createSpyObj('Logger', ['error', 'event', 'debug', 'info', 'warn']);
    returnUrlServiceSpy = jasmine.createSpyObj<ReturnUrlService>('ReturnUrlService', ['popUrl', 'setUrl']);

    const defaultUpdateBookingStatusResponse = new UpdateBookingStatusResponse({ success: true, telephone_conference_id: '1234' });
    const bookingStatusService = new BookingStatusService(videoHearingServiceSpy);

    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;

    beforeEach(() => {
        allocatedCsoResponse = new AllocatedCsoResponse({ cso: null, supports_work_allocation: true, hearing_id: hearingResponse.id });
        videoHearingServiceSpy.getHearingById.and.returnValue(of(hearingResponse));
        videoHearingServiceSpy.cancelBooking.and.returnValue(of(defaultUpdateBookingStatusResponse));
        videoHearingServiceSpy.cancelMultiDayBooking.and.returnValue(of(defaultUpdateBookingStatusResponse));
        videoHearingServiceSpy.mapHearingDetailsResponseToHearingModel.and.returnValue(hearingModel);
        videoHearingServiceSpy.getCurrentRequest.and.returnValue(hearingModel);
        videoHearingServiceSpy.getAllocatedCsoForHearing.and.returnValue(of(allocatedCsoResponse));

        bookingPersistServiceSpy.selectedHearingId = '44';
        userIdentityServiceSpy.getUserInformation.and.returnValue(of(new UserProfileResponse({ is_vh_officer_administrator_role: true })));

        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));

        const bookingPersistServiceMock = new BookingDetailsServiceMock() as any;
        component = new BookingDetailsComponent(
            videoHearingServiceSpy,
            bookingPersistServiceMock,
            userIdentityServiceSpy,
            routerSpy,
            bookingServiceSpy,
            bookingPersistServiceSpy,
            loggerSpy,
            returnUrlServiceSpy,
            bookingStatusService,
            launchDarklyServiceSpy
        );
        component.hearingId = '1';
    });

    it('should get hearings details', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        expect(videoHearingServiceSpy.getHearingById).toHaveBeenCalled();
        expect(component.hearing).toBeTruthy();
        expect(component.hearing.HearingId).toBe('44');
        expect(component.hearing.Duration).toBe(120);
        expect(component.hearing.HearingCaseNumber).toBe('XX3456234565');
        expect(component.hearing.AudioRecordingRequired).toBeTruthy();
        discardPeriodicTasks();
    }));

    it('should get hearings details and map to HearingModel', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        expect(videoHearingServiceSpy.mapHearingDetailsResponseToHearingModel).toHaveBeenCalled();
        expect(component.booking).toBeTruthy();
        expect(component.booking.hearing_id).toBe('44');
        expect(component.booking.scheduled_duration).toBe(120);
        expect(component.booking.cases[0].number).toBe('XX3456234565');
        expect(component.hearing.AudioRecordingRequired).toBeTruthy();
        expect(component.hearing.AllocatedTo).toBe('Not Allocated');
        discardPeriodicTasks();
    }));

    it('should get allocated cso details', fakeAsync(() => {
        const username = 'foo@test.com';
        allocatedCsoResponse.cso = new JusticeUserResponse({ username });
        videoHearingServiceSpy.getAllocatedCsoForHearing.and.returnValue(of(allocatedCsoResponse));
        component.ngOnInit();
        tick();
        expect(component.hearing.AllocatedTo).toBe(username);
        discardPeriodicTasks();
    }));

    it('should set hearing AllocatedTo "Not Required" when venue does not support work allocation', fakeAsync(() => {
        allocatedCsoResponse.supports_work_allocation = false;
        videoHearingServiceSpy.getAllocatedCsoForHearing.and.returnValue(of(allocatedCsoResponse));
        component.ngOnInit();
        tick();
        expect(component.hearing.AllocatedTo).toBe('Not Required');
        discardPeriodicTasks();
    }));

    it('should call service to map hearing response to HearingModel', () => {
        component.mapResponseToModel(new HearingDetailsResponse());
        expect(videoHearingServiceSpy.mapHearingDetailsResponseToHearingModel).toHaveBeenCalled();
    });

    it('should get judge details', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        expect(component.judges).toBeTruthy();
        expect(component.judges.length).toBe(1);
        expect(component.judges[0].UserRoleName).toBe('Judge');
        expect(component.judges[0].ParticipantId).toBe('1');
        expect(component.judges[0].FirstName).toBe('Alan');
        discardPeriodicTasks();
    }));

    it('should get participants details', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        expect(component.participants).toBeTruthy();
        expect(component.participants.length).toBe(2);
        expect(component.participants[0].UserRoleName).toBe('Citizen');
        expect(component.participants[0].ParticipantId).toBe('2');
        discardPeriodicTasks();
    }));
    describe('edit buttons pressed', () => {
        it('should set edit mode if the single day edit button pressed', fakeAsync(() => {
            component.booking = new HearingModel();
            component.editHearing();
            expect(component.booking.isMultiDayEdit).toBeFalsy();
            assertUpdatesAfterEditButtonsPressed();
        }));
        it('should set edit mode if the multi day edit button pressed', fakeAsync(() => {
            component.booking = new HearingModel();
            component.editMultiDaysOfHearing();
            expect(component.booking.isMultiDayEdit).toBeTruthy();
            assertUpdatesAfterEditButtonsPressed();
        }));
        function assertUpdatesAfterEditButtonsPressed() {
            expect(videoHearingServiceSpy.updateHearingRequest).toHaveBeenCalled();
            expect(bookingServiceSpy.resetEditMode).toHaveBeenCalled();
            expect(routerSpy.navigate).toHaveBeenCalledWith([PageUrls.Summary]);
        }
    });
    it('should update hearing status when cancel booking called', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        component.cancelSingleDayBooking('Online abandonment (incomplete registration)');
        expect(component.showCancelBooking).toBeFalsy();
        expect(videoHearingServiceSpy.cancelBooking).toHaveBeenCalledWith(bookingPersistServiceSpy.selectedHearingId, cancel_reason);
        expect(videoHearingServiceSpy.getHearingById).toHaveBeenCalled();
        discardPeriodicTasks();
    }));
    it('should show pop up if the cancel button was clicked', () => {
        component.cancelHearing();
        expect(component.showCancelBooking).toBeTruthy();
    });
    it('should hide pop up if the keep booking button was clicked', () => {
        component.cancelHearing();
        expect(component.showCancelBooking).toBeTruthy();
        component.keepBooking();
        expect(component.showCancelBooking).toBeFalsy();
    });
    it('should set confirmation button be visible if hearing start time less than 30 min', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        component.booking.scheduled_date_time = new Date(Date.now());
        component.timeSubscription = new Observable<any>().subscribe();
        component.setTimeObserver();
        expect(component.isConfirmationTimeValid).toBeTruthy();
        discardPeriodicTasks();
    }));
    it('should not reset confirmation button if current booking is not set', fakeAsync(() => {
        component.booking = undefined;
        component.isConfirmationTimeValid = true;
        component.setTimeObserver();
        expect(component.isConfirmationTimeValid).toBeTruthy();
    }));
    it('should show that user role is Vh office admin', () => {
        const profile = new UserProfileResponse({ is_vh_officer_administrator_role: true });
        component.getUserRole(profile);
        expect(component.isVhOfficerAdmin).toBeTruthy();
    });
    it('should show that user role is not Vh office admin', () => {
        const profile = new UserProfileResponse({ is_vh_officer_administrator_role: false });
        component.getUserRole(profile);
        expect(component.isVhOfficerAdmin).toBeFalsy();
    });
    it('should persist status in the model', () => {
        component.booking = null;
        component.persistStatus(BookingStatus.Created);
        expect(component.booking.status).toBe(BookingStatus.Created);
        expect(videoHearingServiceSpy.updateHearingRequest).toHaveBeenCalled();
    });
    it('should hide cancel button for canceled hearing', () => {
        component.updateStatusHandler(BookingStatus.Cancelled);
        expect(component.showCancelBooking).toBeFalsy();
    });
    it('should not hide cancel button for not canceled hearing', () => {
        component.showCancelBooking = true;
        component.updateStatusHandler(BookingStatus.Created);
        expect(component.showCancelBooking).toBeTruthy();
    });
    it('should hide cancel button for canceled error', () => {
        component.errorHandler('error', BookingStatus.Cancelled);
        expect(component.showCancelBooking).toBeFalsy();
    });
    it('should not hide cancel button for not canceled error', () => {
        component.showCancelBooking = true;
        component.errorHandler('error', BookingStatus.Created);
        expect(component.showCancelBooking).toBeTruthy();
    });
    it('should navigate back to return url if exists', () => {
        returnUrlServiceSpy.popUrl.and.returnValue(PageUrls.DeleteParticipant);
        component.navigateBack();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(PageUrls.DeleteParticipant);
    });
    it('should navigate back to hearing list if not return url set', () => {
        returnUrlServiceSpy.popUrl.and.returnValue(null);
        component.navigateBack();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(PageUrls.BookingsList);
    });
    it('should hide pop up if the close confirm failed ok button was clicked', () => {
        component.showConfirmingFailed = true;
        component.closeConfirmFailed();
        expect(component.showConfirmingFailed).toBeFalsy();
    });
    it('should hide show confirming pop up on error', () => {
        component.showConfirming = true;
        component.errorHandler('error', BookingStatus.Created);
        expect(component.showConfirming).toBeFalsy();
    });
    it('should get update conference phone details', fakeAsync(() => {
        component.ngOnInit();
        tick();
        component.telephoneConferenceId = '7777';
        component.conferencePhoneNumber = '12345';
        component.conferencePhoneNumberWelsh = '54321';

        component.updateWithConferencePhoneDetails();

        expect(component.phoneDetails).toBe(`ENG: 12345 (ID: 7777)
CY: 54321 (ID: 7777)`);
        expect(component.booking.telephone_conference_id).toBe('7777');
        expect(component.hearing.TelephoneConferenceId).toBe('7777');
        discardPeriodicTasks();
    }));
    it('should get conference phone details', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        component.hearing.Status = 'Created';
        videoHearingServiceSpy.getTelephoneConferenceId.and.returnValue(
            of(new PhoneConferenceResponse({ telephone_conference_id: '7777' }))
        );
        videoHearingServiceSpy.getConferencePhoneNumber.and.returnValue(
            new Promise<string>(resolve => {
                resolve('12345');
            })
        );
        component.getConferencePhoneDetails();
        tick(1000);
        expect(component.telephoneConferenceId).toBe('7777');
        expect(component.conferencePhoneNumber).toBe('12345');
        expect(component.booking.telephone_conference_id).toBe('7777');
        expect(component.hearing.TelephoneConferenceId).toBe('7777');
        discardPeriodicTasks();
    }));
    it('should throw exception by getting the conference phone details for closed hearing', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        component.hearing.Status = 'Created';
        videoHearingServiceSpy.getTelephoneConferenceId.and.throwError('Not Found');
        component.getConferencePhoneDetails();
        expect(component.phoneDetails.length).toBe(0);
        expect(loggerSpy.warn).toHaveBeenCalled();
        discardPeriodicTasks();
    }));
    it('should set subscription to check hearing start time', fakeAsync(() => {
        component.isConfirmationTimeValid = true;
        component.$timeObserver = new Observable<any>();
        component.setSubscribers();
        expect(component.$timeObserver).toBeTruthy();
    }));
    it('should on destroy unsubscribe the subscriptions', fakeAsync(() => {
        component.ngOnDestroy();
        expect(component.timeSubscription).toBeFalsy();
        component.$subscriptions.forEach(s => expect(s.closed).toBeTruthy());
    }));
    it('should show cancel button if hearing is not about to start', () => {
        component.ngOnInit();
        videoHearingServiceSpy.isHearingAboutToStart.and.returnValue(false);
        expect(component.canCancelHearing).toBe(true);
    });
    it('should not show cancel button if hearing is about to start', () => {
        component.ngOnInit();
        videoHearingServiceSpy.isHearingAboutToStart.and.returnValue(true);
        expect(component.canCancelHearing).toBe(false);
    });
    it('should show edit button if hearing is open', () => {
        component.ngOnInit();
        videoHearingServiceSpy.isConferenceClosed.and.returnValue(false);
        expect(component.canEditHearing).toBe(true);
    });
    it('should not show edit button if hearing is closed', () => {
        component.ngOnInit();
        videoHearingServiceSpy.isConferenceClosed.and.returnValue(true);
        expect(component.canEditHearing).toBe(false);
    });

    it('should not be able to see retry confirmation when booking is not defined', () => {
        component.booking = null;
        expect(component.canRetryConfirmation).toBeFalsy();

        component.booking = undefined;
        expect(component.canRetryConfirmation).toBeFalsy();
    });

    it('should not be able to see retry confirmation when booking status created', () => {
        component.booking = hearingModel;
        component.booking.status = BookingStatus.Created;
        expect(component.canRetryConfirmation).toBeFalsy();
    });

    it('should not be able to see retry confirmation when booking status cancelled', () => {
        component.booking = hearingModel;
        component.booking.status = BookingStatus.Cancelled;
        expect(component.canRetryConfirmation).toBeFalsy();
    });

    it('should not be able to see retry confirmation when booking is scheduled in the past', () => {
        component.booking = hearingModel;
        const date = new Date();
        date.setHours(date.getHours() - 1);

        component.booking.status = BookingStatus.Failed;
        component.booking.scheduled_date_time = date;
        expect(component.canRetryConfirmation).toBeFalsy();
    });

    it('should be able to see retry confirmation when booking is scheduled in the future', () => {
        component.booking = hearingModel;
        const date = new Date();
        date.setHours(date.getHours() + 1);
        component.booking.status = BookingStatus.Failed;
        component.booking.scheduled_date_time = date;

        expect(component.canRetryConfirmation).toBeTruthy();
    });

    describe('rebookHearing', () => {
        beforeEach(() => {
            videoHearingServiceSpy.rebookHearing.calls.reset();
            videoHearingServiceSpy.getStatus.calls.reset();
            component.isVhOfficerAdmin = true;
        });

        it('should update display when rebook hearing succeeds', fakeAsync(async () => {
            const getStatusResponse = new UpdateBookingStatusResponse({
                success: true,
                telephone_conference_id: '123'
            });
            const conferencePhoneNumber = '1234';
            videoHearingServiceSpy.getStatus.and.returnValue(Promise.resolve(getStatusResponse));
            videoHearingServiceSpy.getConferencePhoneNumber.and.returnValue(
                new Promise<string>(resolve => {
                    resolve(conferencePhoneNumber);
                })
            );

            component.ngOnInit();
            await component.rebookHearing();
            tick(50000);

            expect(videoHearingServiceSpy.rebookHearing).toHaveBeenCalledWith(component.hearingId);
            expect(videoHearingServiceSpy.getStatus).toHaveBeenCalledTimes(1);
            expect(component.telephoneConferenceId).toBe(getStatusResponse.telephone_conference_id);
            expect(component.conferencePhoneNumber).toBe(conferencePhoneNumber);
            expect(component.conferencePhoneNumberWelsh).toBe(conferencePhoneNumber);
            expect(component.booking.isConfirmed).toBeTruthy();
            expect(component.showConfirming).toBeFalsy();

            discardPeriodicTasks();
        }));

        it('should update display when rebook hearing fails', fakeAsync(async () => {
            const getStatusResponse = new UpdateBookingStatusResponse({
                success: false
            });
            videoHearingServiceSpy.getStatus.and.returnValue(Promise.resolve(getStatusResponse));

            component.ngOnInit();
            await component.rebookHearing();
            tick(60000);

            expect(videoHearingServiceSpy.rebookHearing).toHaveBeenCalledWith(component.hearingId);
            expect(videoHearingServiceSpy.getStatus).toHaveBeenCalledTimes(11);
            expect(component.showConfirmingFailed).toBeTruthy();
            expect(component.hearing.Status).toBe(BookingStatus.Failed);
            expect(component.showConfirming).toBeFalsy();

            discardPeriodicTasks();
        }));

        it('should not rebook hearing when user is not in the VH officer role', fakeAsync(async () => {
            component.isVhOfficerAdmin = false;

            await component.rebookHearing();

            expect(videoHearingServiceSpy.rebookHearing).toHaveBeenCalledTimes(0);

            discardPeriodicTasks();
        }));
    });

    describe('cancel multi day hearing', () => {
        it('should update hearing statuses', fakeAsync(() => {
            component.ngOnInit();
            tick(1000);
            component.cancelMultiDayBooking('Online abandonment (incomplete registration)');
            expect(component.showCancelBooking).toBeFalsy();
            expect(videoHearingServiceSpy.cancelMultiDayBooking).toHaveBeenCalledWith(
                bookingPersistServiceSpy.selectedHearingId,
                cancel_reason,
                true
            );
            expect(videoHearingServiceSpy.getHearingById).toHaveBeenCalled();
            discardPeriodicTasks();
        }));
    });

    describe('isMultiDayUpdateAvailable', () => {
        it('should return true when all conditions are met', fakeAsync(() => {
            component.ngOnInit();
            tick(1000);
            component.hearing.GroupId = '123';
            component.multiDayBookingEnhancementsEnabled = true;
            expect(component.isMultiDayUpdateAvailable()).toBeTruthy();
            discardPeriodicTasks();
        }));

        it('should return false when hearing is not multi day', fakeAsync(() => {
            component.ngOnInit();
            tick(1000);
            component.hearing.GroupId = null;
            component.multiDayBookingEnhancementsEnabled = true;
            expect(component.isMultiDayUpdateAvailable()).toBeFalsy();
            discardPeriodicTasks();
        }));

        it('should return false when multi day booking enhancements are not enabled', fakeAsync(() => {
            component.ngOnInit();
            tick(1000);
            component.hearing.GroupId = '123';
            component.multiDayBookingEnhancementsEnabled = false;
            expect(component.isMultiDayUpdateAvailable()).toBeFalsy();
            discardPeriodicTasks();
        }));

        it('should return false when last day of multi day hearing', fakeAsync(() => {
            component.ngOnInit();
            tick(1000);
            component.hearing.GroupId = '123';
            component.hearing.MultiDayHearingLastDayScheduledDateTime = component.hearing.StartTime;
            component.multiDayBookingEnhancementsEnabled = true;
            expect(component.isMultiDayUpdateAvailable()).toBeFalsy();
            discardPeriodicTasks();
        }));
    });
});
