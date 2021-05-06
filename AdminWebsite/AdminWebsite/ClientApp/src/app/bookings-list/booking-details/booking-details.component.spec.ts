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
    BookingStatus,
    HearingDetailsResponse,
    PhoneConferenceResponse,
    UpdateBookingStatus,
    UpdateBookingStatusRequest,
    UpdateBookingStatusResponse,
    UserProfileResponse
} from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { UserIdentityService } from '../../services/user-identity.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { PageUrls } from '../../shared/page-url.constants';
import { BookingDetailsComponent } from './booking-details.component';

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
            'Alan Brake',
            '',
            'ABC Solicitors',
            'Respondent',
            '12345678',
            'interpretee',
            false
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
            'Roy Bark',
            '',
            'ABC Solicitors',
            'Respondent',
            '12345678',
            'interpretee',
            false
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
            'Fill',
            '',
            'ABC Solicitors',
            'Respondent',
            '12345678',
            'interpretee',
            false
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
hearingModel.questionnaire_not_required = false;
hearingModel.audio_recording_required = true;

const updateBookingStatusRequest = new UpdateBookingStatusRequest();
updateBookingStatusRequest.status = UpdateBookingStatus.Cancelled;
updateBookingStatusRequest.updated_by = '';
updateBookingStatusRequest.cancel_reason = 'Online abandonment (incomplete registration)';

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
        'updateBookingStatus',
        'getCurrentRequest',
        'getTelephoneConferenceId',
        'getConferencePhoneNumber'
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

    beforeEach(() => {
        videoHearingServiceSpy.getHearingById.and.returnValue(of(hearingResponse));
        videoHearingServiceSpy.updateBookingStatus.and.returnValue(of());
        videoHearingServiceSpy.mapHearingDetailsResponseToHearingModel.and.returnValue(hearingModel);
        videoHearingServiceSpy.getCurrentRequest.and.returnValue(hearingModel);

        bookingPersistServiceSpy.selectedHearingId = '44';
        userIdentityServiceSpy.getUserInformation.and.returnValue(of(true));

        const bookingPersistServiceMock = new BookingDetailsServiceMock() as any;
        component = new BookingDetailsComponent(
            videoHearingServiceSpy,
            bookingPersistServiceMock,
            userIdentityServiceSpy,
            routerSpy,
            bookingServiceSpy,
            bookingPersistServiceSpy,
            loggerSpy,
            returnUrlServiceSpy
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
        expect(component.hearing.QuestionnaireNotRequired).toBeTruthy();
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
        expect(component.hearing.QuestionnaireNotRequired).toBeTruthy();
        expect(component.hearing.AudioRecordingRequired).toBeTruthy();
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
    it('should set edit mode if the edit button pressed', fakeAsync(() => {
        component.editHearing();
        expect(videoHearingServiceSpy.updateHearingRequest).toHaveBeenCalled();
        expect(bookingServiceSpy.resetEditMode).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith([PageUrls.Summary]);
    }));
    it('should update hearing status when cancel booking called', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        component.cancelBooking('Online abandonment (incomplete registration)');
        expect(component.showCancelBooking).toBeFalsy();
        expect(videoHearingServiceSpy.updateBookingStatus).toHaveBeenCalledWith(
            bookingPersistServiceSpy.selectedHearingId,
            updateBookingStatusRequest
        );
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
    it('should confirm booking', () => {
        component.isVhOfficerAdmin = true;
        component.confirmHearing();
        expect(videoHearingServiceSpy.getHearingById).toHaveBeenCalled();
    });
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
    it('should not confirm booking if not the VH officer admin role', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        const initialStatus = component.booking.status;
        component.isVhOfficerAdmin = false;
        component.confirmHearing();
        expect(component.booking.status).toBe(initialStatus);
        discardPeriodicTasks();
    }));
    it('should persist status in the model', () => {
        component.booking = null;
        component.persistStatus(UpdateBookingStatus.Created);
        expect(component.booking.status).toBe(UpdateBookingStatus.Created);
        expect(videoHearingServiceSpy.updateHearingRequest).toHaveBeenCalled();
    });
    it('should hide cancel button for canceled hearing', () => {
        component.updateStatusHandler(UpdateBookingStatus.Cancelled);
        expect(component.showCancelBooking).toBeFalsy();
    });
    it('should not hide cancel button for not canceled hearing', () => {
        component.showCancelBooking = true;
        component.updateStatusHandler(UpdateBookingStatus.Created);
        expect(component.showCancelBooking).toBeTruthy();
    });
    it('should hide cancel button for canceled error', () => {
        component.errorHandler('error', UpdateBookingStatus.Cancelled);
        expect(component.showCancelBooking).toBeFalsy();
    });
    it('should not hide cancel button for not canceled error', () => {
        component.showCancelBooking = true;
        component.errorHandler('error', UpdateBookingStatus.Created);
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
    it('should not show pop up if the confirm not failed', () => {
        videoHearingServiceSpy.updateBookingStatus.and.returnValue(of(new UpdateBookingStatusResponse({ success: true })));
        component.isVhOfficerAdmin = true;
        component.confirmHearing();
        expect(component.showConfirmingFailed).toBeFalsy();
    });
    it('should show pop up if the confirm failed', fakeAsync(() => {
        videoHearingServiceSpy.updateBookingStatus.and.returnValue(of(new UpdateBookingStatusResponse({ success: false })));
        component.isVhOfficerAdmin = true;
        component.confirmHearing();
        tick();
        expect(component.showConfirmingFailed).toBeTruthy();
    }));
    it('should hide pop up if the close confirm failed ok button was clicked', () => {
        component.showConfirmingFailed = true;
        component.closeConfirmFailed();
        expect(component.showConfirmingFailed).toBeFalsy();
    });
    it('should hide show confirming pop up on error', () => {
        component.showConfirming = true;
        component.errorHandler('error', UpdateBookingStatus.Created);
        expect(component.showConfirming).toBeFalsy();
    });
    it('should get update conference phone details', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        component.telephoneConferenceId = '7777';
        component.conferencePhoneNumber = '12345';

        component.updateWithConferencePhoneDetails();

        expect(component.phoneDetails).toBe('12345 (ID: 7777)');
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
    it('should show edit button if 30min or more remain to start of hearing', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + 1);
        component.booking.scheduled_date_time = futureDate;
        const timeframe = component.canCancelHearing;
        expect(timeframe).toBe(true);
        discardPeriodicTasks();
    }));

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
    });

    it('should be able to see retry confirmation when booking is scheduled in the future', () => {
        component.booking = hearingModel;
        const date = new Date();
        date.setHours(date.getHours() + 1);
        component.booking.status = BookingStatus.Failed;
        component.booking.scheduled_date_time = date;

        expect(component.canRetryConfirmation).toBeTruthy();
    });
});
