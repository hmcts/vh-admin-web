import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { CaseModel } from '../../common/model/case.model';
import { BookingService } from '../../services/booking.service';
import { BookingPersistService } from '../../services/bookings-persist.service';
import {
    BookingStatus,
    CaseResponse,
    CaseTypeResponse,
    HearingDetailsResponse,
    JudiciaryParticipantResponse,
    ParticipantResponse,
    PhoneConferenceResponse,
    UpdateBookingStatusResponse,
    UserProfileResponse,
    VideoSupplier
} from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { UserIdentityService } from '../../services/user-identity.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { PageUrls } from '../../shared/page-url.constants';
import { BookingDetailsComponent } from './booking-details.component';
import { BookingStatusService } from 'src/app/services/booking-status-service';
import { HearingRoleCodes } from '../../common/model/hearing-roles.model';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { VHParticipant } from 'src/app/common/model/vh-participant';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { CaseTypeModel } from 'src/app/common/model/case-type.model';

let component: BookingDetailsComponent;
let videoHearingServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let routerSpy: jasmine.SpyObj<Router>;
let returnUrlServiceSpy: jasmine.SpyObj<ReturnUrlService>;
let bookingServiceSpy: jasmine.SpyObj<BookingService>;
let bookingPersistServiceSpy: jasmine.SpyObj<BookingPersistService>;
let userIdentityServiceSpy: jasmine.SpyObj<UserIdentityService>;

export class BookingDetailsTestData {
    getBookingsDetailsModel() {
        const booking = VHBooking.createForDetails(
            '44',
            new Date('2019-11-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
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
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );
        booking.allocatedTo = 'Not Allocated';
        return booking;
    }

    getParticipants() {
        const participants: Array<VHParticipant> = [];
        const judges: Array<VHParticipant> = [];
        const p1 = VHParticipant.createForDetails(
            '1',
            'externalRefId',
            'Mrs',
            'Alan',
            'Brake',
            'Judge',
            'email.p1@hmcts.net',
            'email1@hmcts.net',
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

        const p2 = VHParticipant.createForDetails(
            '2',
            'externalRefId',
            'Mrs',
            'Roy',
            'Bark',
            'Citizen',
            'email.p2@hmcts.net',
            'email2@hmcts.net',
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
        const p3 = VHParticipant.createForDetails(
            '2',
            'externalRefId',
            'Mrs',
            'Fill',
            'Green',
            'Professional',
            'email.p3@hmcts.net',
            'email3@hmcts.net',
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
        let endpoint = new EndpointModel(null);
        endpoint.displayName = 'Courtroom 001';
        endpoints.push(endpoint);
        endpoint = new EndpointModel(null);
        endpoint.displayName = 'Courtroom 002';
        endpoints.push(endpoint);
        return endpoints;
    }
}

let hearingResponse: HearingDetailsResponse;

const caseModel = new CaseModel();
caseModel.name = 'X vs Y';
caseModel.number = 'XX3456234565';
const hearingModel = new VHBooking();
hearingModel.hearingId = '44';
hearingModel.case = caseModel;
hearingModel.scheduledDuration = 120;
let now = new Date();
now.setMonth(now.getMonth());
now = new Date(now);
hearingModel.scheduledDateTime = now;
hearingModel.audioRecordingRequired = true;
hearingModel.caseType = new CaseTypeModel({
    name: 'Tribunal',
    serviceId: '123',
    isAudioRecordingAllowed: true
});

const cancel_reason = 'Online abandonment (incomplete registration)';

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
        'cancelMultiDayBooking',
        'isTotalHearingMoreThanThreshold'
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
        hearingResponse = createHearingDetailsResponse();
        videoHearingServiceSpy.getHearingById.and.returnValue(of(hearingResponse));
        videoHearingServiceSpy.cancelBooking.and.returnValue(of(defaultUpdateBookingStatusResponse));
        videoHearingServiceSpy.cancelMultiDayBooking.and.returnValue(of(defaultUpdateBookingStatusResponse));
        videoHearingServiceSpy.mapHearingDetailsResponseToHearingModel.and.returnValue(hearingModel);
        videoHearingServiceSpy.getCurrentRequest.and.returnValue(hearingModel);

        bookingPersistServiceSpy.selectedHearingId = '44';
        userIdentityServiceSpy.getUserInformation.and.returnValue(of(new UserProfileResponse({ is_vh_officer_administrator_role: true })));

        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));

        component = new BookingDetailsComponent(
            videoHearingServiceSpy,
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
        expect(component.hearing.hearingId).toBe('44');
        expect(component.hearing.scheduledDuration).toBe(120);
        expect(component.hearing.case.number).toBe('XX3456234565');
        expect(component.hearing.audioRecordingRequired).toBeTruthy();
        discardPeriodicTasks();
    }));

    it('should get hearings details and map to HearingModel', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        expect(videoHearingServiceSpy.mapHearingDetailsResponseToHearingModel).toHaveBeenCalled();
        expect(component.booking).toBeTruthy();
        expect(component.booking.hearingId).toBe('44');
        expect(component.booking.scheduledDuration).toBe(120);
        expect(component.booking.case.number).toBe('XX3456234565');
        expect(component.hearing.audioRecordingRequired).toBeTruthy();
        expect(component.hearing.allocatedTo).toBe('Not Allocated');
        discardPeriodicTasks();
    }));

    it('should call service to map hearing response to HearingModel', () => {
        component.mapResponseToModel(new HearingDetailsResponse());
        expect(videoHearingServiceSpy.mapHearingDetailsResponseToHearingModel).toHaveBeenCalled();
    });

    it('should get judge details', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        const judges = component.judicialMembers?.filter(j => j.roleCode === 'Judge');
        expect(judges).toBeTruthy();
        expect(judges.length).toBe(1);
        expect(judges[0].roleCode).toBe('Judge');
        expect(judges[0].firstName).toBe('Alan');
        discardPeriodicTasks();
    }));

    it('should get participants details', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        expect(component.participants).toBeTruthy();
        expect(component.participants.length).toBe(2);
        expect(component.participants[0].userRoleName).toBe('Citizen');
        expect(component.participants[0].id).toBe('2');
        discardPeriodicTasks();
    }));
    describe('edit buttons pressed', () => {
        it('should set edit mode if the single day edit button pressed', fakeAsync(() => {
            component.booking = new VHBooking();
            component.editHearing();
            expect(component.booking.isMultiDayEdit).toBeFalsy();
            assertUpdatesAfterEditButtonsPressed();
        }));
        it('should set edit mode if the multi day edit button pressed', fakeAsync(() => {
            component.booking = new VHBooking();
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
        component.booking.scheduledDateTime = new Date(Date.now());
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
        expect(component.booking.telephoneConferenceId).toBe('7777');
        expect(component.hearing.telephoneConferenceId).toBe('7777');
        discardPeriodicTasks();
    }));
    it('should get conference phone details', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        component.hearing.status = 'Created';
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
        expect(component.booking.telephoneConferenceId).toBe('7777');
        expect(component.hearing.telephoneConferenceId).toBe('7777');
        discardPeriodicTasks();
    }));
    it('should throw exception by getting the conference phone details for closed hearing', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        component.hearing.status = 'Created';
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
    it('should show edit series button if total days is less than 40', () => {
        component.ngOnInit();
        videoHearingServiceSpy.isTotalHearingMoreThanThreshold.and.returnValue(false);
        expect(component.isTotalHearingMoreThanThreshold).toBe(false);
    });
    it('should not show edit series button if total days is more than 40', () => {
        component.ngOnInit();
        videoHearingServiceSpy.isTotalHearingMoreThanThreshold.and.returnValue(true);
        expect(component.isTotalHearingMoreThanThreshold).toBe(true);
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
        component.booking.scheduledDateTime = date;
        expect(component.canRetryConfirmation).toBeFalsy();
    });

    it('should be able to see retry confirmation when booking is scheduled in the future', () => {
        component.booking = hearingModel;
        const date = new Date();
        date.setHours(date.getHours() + 1);
        component.booking.status = BookingStatus.Failed;
        component.booking.scheduledDateTime = date;

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
            expect(component.hearing.status).toBe(BookingStatus.Failed);
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
            hearingResponse.group_id = '123';
            launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(true));
            component.ngOnInit();
            tick(1000);
            expect(component.isMultiDayUpdateAvailable()).toBeTruthy();
            discardPeriodicTasks();
        }));

        it('should return false when hearing is not multi day', fakeAsync(() => {
            hearingResponse.group_id = null;
            launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(true));
            component.ngOnInit();
            tick(1000);
            expect(component.isMultiDayUpdateAvailable()).toBeFalsy();
            discardPeriodicTasks();
        }));

        it('should return false when multi day booking enhancements are not enabled', fakeAsync(() => {
            hearingResponse.group_id = '123';
            launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));
            component.ngOnInit();
            tick(1000);
            expect(component.isMultiDayUpdateAvailable()).toBeFalsy();
            discardPeriodicTasks();
        }));

        it('should return false when last day of multi day hearing', fakeAsync(() => {
            hearingResponse.group_id = '123';
            hearingResponse.multi_day_hearing_last_day_scheduled_date_time = hearingResponse.scheduled_date_time;
            launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(true));
            component.ngOnInit();
            tick(1000);
            expect(component.isMultiDayUpdateAvailable()).toBeFalsy();
            discardPeriodicTasks();
        }));
    });
});

function createHearingDetailsResponse(): HearingDetailsResponse {
    return new HearingDetailsResponse({
        id: '44',
        scheduled_date_time: new Date(),
        scheduled_duration: 120,
        hearing_venue_code: 'venue-code',
        hearing_venue_name: 'venue-name',
        case_type: new CaseTypeResponse({
            name: 'case-type-name',
            service_id: 'service-id'
        }),
        cases: createCaseResponses(),
        participants: createParticipantResponses(),
        judiciary_participants: createJudiciaryParticipantResponses(),
        hearing_room_name: 'room-name',
        other_information: '|OtherInformation|Other info',
        created_date: new Date(),
        created_by: 'created-by@email.com',
        updated_by: 'System',
        updated_date: new Date(),
        confirmed_by: 'System',
        confirmed_date: new Date(),
        status: BookingStatus.Created,
        audio_recording_required: true,
        cancel_reason: 'cancel-reason',
        endpoints: [],
        group_id: null,
        conference_supplier: VideoSupplier.Vodafone,
        allocated_to_username: 'Not Allocated'
    });
}

function createCaseResponses(): CaseResponse[] {
    const cases: CaseResponse[] = [];
    const caseResponse = new CaseResponse({
        number: 'XX3456234565',
        name: 'X vs Y',
        is_lead_case: true
    });
    cases.push(caseResponse);

    return cases;
}

function createJudiciaryParticipantResponses(): JudiciaryParticipantResponse[] {
    const judiciaryParticipants: JudiciaryParticipantResponse[] = [];
    const judge = new JudiciaryParticipantResponse();
    judge.title = 'Mr';
    judge.first_name = 'Alan';
    judge.last_name = 'Brake';
    judge.full_name = 'Alan Brake';
    judge.email = 'email1@hmcts.net';
    judge.work_phone = '12345678';
    judge.personal_code = 'judge-personal-code';
    judge.role_code = 'Judge';
    judge.display_name = 'Alan Brake';
    judge.is_generic = true;
    judiciaryParticipants.push(judge);

    return judiciaryParticipants;
}

function createParticipantResponses(): ParticipantResponse[] {
    const participants: ParticipantResponse[] = [];
    const p1 = new ParticipantResponse({
        id: '2',
        external_reference_id: 'externalRefId',
        title: 'Mrs',
        first_name: 'Roy',
        last_name: 'Bark',
        user_role_name: 'Citizen',
        username: 'email.p2@hmcts.net',
        contact_email: 'email2@hmcts.net',
        hearing_role_name: 'Litigant in person',
        hearing_role_code: HearingRoleCodes.Applicant,
        display_name: 'Roy Bark',
        organisation: 'ABC Solicitors',
        telephone_number: '12345678'
    });
    const p2 = new ParticipantResponse({
        id: '2',
        external_reference_id: 'externalRefId',
        title: 'Mrs',
        first_name: 'Fill',
        last_name: 'Green',
        user_role_name: 'Professional',
        username: 'email.p3@hmcts.net',
        contact_email: 'email3@hmcts.net',
        hearing_role_name: 'Litigant in person',
        hearing_role_code: HearingRoleCodes.Applicant,
        display_name: 'Fill',
        organisation: 'ABC Solicitors',
        telephone_number: '12345678'
    });
    participants.push(p1);
    participants.push(p2);

    return participants;
}
