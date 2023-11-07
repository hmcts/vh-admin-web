import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { LinkedParticipantModel, LinkedParticipantType } from 'src/app/common/model/linked-participant.model';
import { OtherInformationModel } from 'src/app/common/model/other-information.model';
import { CancelPopupComponent } from 'src/app/popups/cancel-popup/cancel-popup.component';
import { RemoveInterpreterPopupComponent } from 'src/app/popups/remove-interpreter-popup/remove-interpreter-popup.component';
import { SaveFailedPopupComponent } from 'src/app/popups/save-failed-popup/save-failed-popup.component';
import { PipeStringifierService } from 'src/app/services/pipe-stringifier.service';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';
import { LongDatetimePipe } from '../../../app/shared/directives/date-time.pipe';
import { CaseModel } from '../../common/model/case.model';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { RemovePopupComponent } from '../../popups/remove-popup/remove-popup.component';
import { WaitPopupComponent } from '../../popups/wait-popup/wait-popup.component';
import { BookingService } from '../../services/booking.service';
import {
    BookHearingException,
    BookingStatus,
    HearingDetailsResponse,
    UpdateBookingStatusResponse,
    ValidationProblemDetails
} from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { RecordingGuardService } from '../../services/recording-guard.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { MockValues } from '../../testing/data/test-objects';
import { BookingEditStubComponent } from '../../testing/stubs/booking-edit-stub';
import { ParticipantsListStubComponent } from '../../testing/stubs/participant-list-stub';
import { ParticipantListComponent } from '../participant';
import { ParticipantService } from '../services/participant.service';
import { SummaryComponent } from './summary.component';
import { ResponseTestData } from 'src/app/testing/data/response-test-data';
import { BookingStatusService } from 'src/app/services/booking-status-service';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { TruncatableTextComponent } from 'src/app/shared/truncatable-text/truncatable-text.component';

function initExistingHearingRequest(): HearingModel {
    const pat1 = new ParticipantModel();
    pat1.email = 'aa@hmcts.net';
    pat1.representee = 'citizen 01';
    pat1.display_name = 'solicitor 01';
    pat1.id = '123123-123';

    const today = new Date();
    today.setHours(14, 30);

    const newCaseRequest = new CaseModel();
    newCaseRequest.name = 'Mr. Test User vs HMRC';
    newCaseRequest.number = 'TX/12345/2018';

    const existingRequest = new HearingModel();
    existingRequest.hearing_type_id = 2;
    existingRequest.cases.push(newCaseRequest);
    existingRequest.hearing_venue_id = 2;
    existingRequest.scheduled_date_time = today;
    existingRequest.scheduled_duration = 80;
    existingRequest.other_information = '|OtherInformation|some notes';
    existingRequest.audio_recording_required = true;
    existingRequest.court_room = '123W';
    const hearingTypeName = MockValues.HearingTypesList.find(c => c.id === existingRequest.hearing_type_id).name;
    existingRequest.hearing_type_name = hearingTypeName;
    const courtString = MockValues.Courts.find(c => c.id === existingRequest.hearing_venue_id).name;
    existingRequest.court_name = courtString;
    existingRequest.multiDays = false;
    existingRequest.end_hearing_date_time = new Date(addDays(Date.now(), 7));

    existingRequest.participants = [];
    existingRequest.participants.push(pat1);
    return existingRequest;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function initBadHearingRequest(): HearingModel {
    const today = new Date();
    today.setHours(14, 30);

    const newCaseRequest = new CaseModel();
    newCaseRequest.name = 'Mr. Test User vs HMRC';
    newCaseRequest.number = 'TX/12345/2018';

    const existingRequest = new HearingModel();
    existingRequest.hearing_type_id = 2;
    existingRequest.cases.push(newCaseRequest);
    existingRequest.hearing_venue_id = 2;
    existingRequest.scheduled_date_time = today;
    existingRequest.scheduled_duration = 80;
    return existingRequest;
}

let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let recordingGuardServiceSpy: jasmine.SpyObj<RecordingGuardService>;
const stringifier = new PipeStringifierService();

const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'url']);
const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'info', 'warn', 'debug']);
recordingGuardServiceSpy = jasmine.createSpyObj<RecordingGuardService>('RecordingGuardService', [
    'switchOffRecording',
    'mandatoryRecordingForHearingRole'
]);

videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
    'getHearingTypes',
    'getCurrentRequest',
    'updateHearingRequest',
    'saveHearing',
    'cancelRequest',
    'updateHearing',
    'setBookingHasChanged',
    'cloneMultiHearings',
    'isConferenceClosed',
    'isHearingAboutToStart',
    'getStatus',
    'updateFailedStatus'
]);
const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.eJudFeature).and.returnValue(of(true));
launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.useV2Api).and.returnValue(of(false));
const bookingStatusService = new BookingStatusService(videoHearingsServiceSpy);

describe('SummaryComponent with valid request', () => {
    let component: SummaryComponent;
    let fixture: ComponentFixture<SummaryComponent>;

    let existingRequest: any;

    beforeEach(waitForAsync(() => {
        existingRequest = initExistingHearingRequest();

        const mockResp = new UpdateBookingStatusResponse();
        mockResp.success = true;
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
        videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
        videoHearingsServiceSpy.saveHearing.and.returnValue(Promise.resolve(ResponseTestData.getHearingResponseTestData()));
        videoHearingsServiceSpy.cloneMultiHearings.and.callThrough();
        videoHearingsServiceSpy.getStatus.and.returnValue(Promise.resolve(mockResp));
        mockResp.success = false;
        videoHearingsServiceSpy.updateFailedStatus.and.returnValue(Promise.resolve(mockResp));
        TestBed.configureTestingModule({
            providers: [
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: Logger, useValue: loggerSpy },
                { provide: RecordingGuardService, useValue: recordingGuardServiceSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                { provide: BookingStatusService, useValue: bookingStatusService }
            ],
            declarations: [
                SummaryComponent,
                BreadcrumbStubComponent,
                CancelPopupComponent,
                ParticipantsListStubComponent,
                BookingEditStubComponent,
                RemovePopupComponent,
                WaitPopupComponent,
                SaveFailedPopupComponent,
                LongDatetimePipe,
                RemoveInterpreterPopupComponent,
                TruncatableTextComponent
            ],
            imports: [RouterTestingModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Call ProcessBooking when hearingStatusResponse has failed', async () => {
        // arrange
        const hearingStatusResponse = { success: false };
        await component.processBooking(jasmine.any(HearingDetailsResponse), hearingStatusResponse);
        expect(videoHearingsServiceSpy.updateFailedStatus).toHaveBeenCalled();
    });

    it('Call ProcessBooking when hearingStatusResponse has succeeded and it is Multiple Individual HearingDates', async () => {
        // arrange
        const hearingStatusResponse = { success: true };
        component.hearing.multiDays = true;
        component.hearing.end_hearing_date_time = new Date(component.hearing.scheduled_date_time);
        component.hearing.end_hearing_date_time.setDate(component.hearing.end_hearing_date_time.getDate() + 7);
        component.hearing.hearing_dates = [
            new Date(component.hearing.scheduled_date_time),
            new Date(component.hearing.end_hearing_date_time)
        ];
        fixture.detectChanges();

        await component.processBooking(jasmine.any(HearingDetailsResponse), hearingStatusResponse);

        expect(videoHearingsServiceSpy.cloneMultiHearings).toHaveBeenCalled();
    });

    it(
        'Call ProcessBooking when hearingStatusResponse has succeeded and it is not Multiple Individual HearingDates ' +
            'and is hearing date range',
        async () => {
            // arrange
            const hearingStatusResponse = { success: true };
            component.hearing.multiDays = true;
            component.hearing.hearing_dates = [];
            fixture.detectChanges();

            await component.processBooking(jasmine.any(HearingDetailsResponse), hearingStatusResponse);

            expect(videoHearingsServiceSpy.cloneMultiHearings).toHaveBeenCalled();
        }
    );

    it(
        'Call ProcessBooking when hearingStatusResponse has succeeded and it is not Multiple Individual HearingDates ' +
            'and is not hearing date range',
        async () => {
            // arrange
            const hearingStatusResponse = { success: true };
            const hearingDetailsResponse = { id: 'mock hearing Id' };
            component.hearing.multiDays = true;
            component.hearing.hearing_dates = [new Date(component.hearing.scheduled_date_time)];

            fixture.detectChanges();

            await component.processBooking(hearingDetailsResponse, hearingStatusResponse);
            const message = '[Booking] - [Summary] - Hearing has just one day, no remaining days to book';
            expect(loggerSpy.info).toHaveBeenCalledWith(
                message,
                Object({
                    hearingId: hearingDetailsResponse.id,
                    caseName: component.hearing.cases[0].name,
                    caseNumber: component.hearing.cases[0].number
                })
            );
        }
    );

    it('should get booking data from storage', () => {
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.hearing).toBeTruthy();
    });
    it('should display summary data from existing hearing', () => {
        expect(component.caseNumber).toEqual(existingRequest.cases[0].number);
        expect(component.caseName).toEqual(existingRequest.cases[0].name);
        expect(component.otherInformation.OtherInformation).toEqual(
            stringifier.decode<OtherInformationModel>(existingRequest.other_information).OtherInformation
        );
        const hearingstring = MockValues.HearingTypesList.find(c => c.id === existingRequest.hearing_type_id).name;
        expect(component.caseHearingType).toEqual(hearingstring);
        expect(component.hearingDate).toEqual(existingRequest.scheduled_date_time);
        const courtString = MockValues.Courts.find(c => c.id === existingRequest.hearing_venue_id);
        expect(component.courtRoomAddress).toEqual(`${courtString.name}, 123W`);
    });
    it('should remove participant', () => {
        component.ngOnInit();
        component.selectedParticipantEmail = 'aa@hmcts.net';
        component.removeParticipant();
        fixture.detectChanges();
        expect(component.hearing.participants.length).toBe(0);
        expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
    });
    it('should not remove participant by not existing email', () => {
        component.ngOnInit();
        const pat1 = new ParticipantModel();
        pat1.email = 'aa@hmcts.net';
        component.hearing.participants = [];
        component.hearing.participants.push(pat1);
        component.selectedParticipantEmail = 'bb@hmcts.net';

        expect(component.hearing.participants.length).toBe(1);
        component.removeParticipant();
        fixture.detectChanges();
        expect(component.hearing.participants.length).toBe(1);
    });
    it('should cancel booking and navigate away', () => {
        component.cancelBooking();
        fixture.detectChanges();
        expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });
    it('should hide pop up that indicated process saving a booking', () => {
        expect(component.showWaitSaving).toBeFalsy();
    });
    it('should save new booking', fakeAsync(async () => {
        component.ngOnInit();
        fixture.detectChanges();

        await component.bookHearing().then(() => {
            expect(component.bookingsSaving).toBeTruthy();
            expect(component.showWaitSaving).toBeFalsy();
            expect(routerSpy.navigate).toHaveBeenCalled();
            expect(videoHearingsServiceSpy.saveHearing).toHaveBeenCalled();
        });
    }));
    it('should set audio recording to false if case type is CACD', () => {
        component.hearing.case_type = component.constants.CaseTypes.CourtOfAppealCriminalDivision;
        component.ngOnInit();
        expect(component.hearing.audio_recording_required).toBe(false);
    });
    it('should set audio recording to true if an interpreter is present', () => {
        component.interpreterPresent = true;
        component.isAudioRecordingRequired();
        fixture.detectChanges();
        expect(component.hearing.audio_recording_required).toBe(true);
    });
    it('should set audio recording to false if case type is CACD and an interpreter is present', () => {
        component.hearing.case_type = component.constants.CaseTypes.CourtOfAppealCriminalDivision;
        component.interpreterPresent = true;
        component.isAudioRecordingRequired();
        component.ngOnInit();
        expect(component.hearing.audio_recording_required).toBe(false);
    });
    it('should set audio recording to false if case type is Crime Crown Court', () => {
        component.hearing.case_type = component.constants.CaseTypes.CrimeCrownCourt;
        component.ngOnInit();
        expect(component.hearing.audio_recording_required).toBe(false);
    });
    it('should set audio recording to false if case type is Crime Crown Court and an interpreter is present', () => {
        component.hearing.case_type = component.constants.CaseTypes.CrimeCrownCourt;
        component.interpreterPresent = true;
        component.isAudioRecordingRequired();
        component.ngOnInit();
        expect(component.hearing.audio_recording_required).toBe(false);
    });
    it('should display valid court address when room number is empty', () => {
        component.hearing.court_room = '';
        component.ngOnInit();
        fixture.detectChanges();
        const courtString = MockValues.Courts.find(c => c.id === existingRequest.hearing_venue_id);
        expect(component.courtRoomAddress).toEqual(`${courtString.name}`);
    });
    it('should display valid audio recording selected option', () => {
        component.hearing.audio_recording_required = false;
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.audioChoice).toBe('No');
    });
    it('should remove interpretee and interpreter and clear the linked participant list on remove interpretee', () => {
        component.ngOnInit();
        component.hearing.participants = [];

        const participants: ParticipantModel[] = [];
        let participant = new ParticipantModel();
        participant.first_name = 'firstname';
        participant.last_name = 'lastname';
        participant.email = 'firstname.lastname@email.com';
        participant.case_role_name = 'Claimant';
        participant.hearing_role_name = 'Litigant in person';
        participants.push(participant);

        participant = new ParticipantModel();
        participant.first_name = 'firstname1';
        participant.last_name = 'lastname1';
        participant.email = 'firstname1.lastname1@email.com';
        participant.case_role_name = 'Claimant';
        participant.hearing_role_name = 'Interpreter';
        participant.interpreterFor = 'firstname.lastname@email.com';
        participants.push(participant);
        component.hearing.participants = participants;

        const lp = new LinkedParticipantModel();
        lp.participantEmail = 'firstname.lastname@email.com';
        lp.linkedParticipantEmail = 'firstname1.lastname1@email.com';
        const lps: LinkedParticipantModel[] = [];
        lps.push(lp);
        component.hearing.linked_participants = lps;
        component.selectedParticipantEmail = 'firstname.lastname@email.com';

        component.handleContinueRemoveInterpreter();
        expect(component.hearing.linked_participants).toEqual([]);
        expect(component.hearing.participants).toEqual([]);
    });
    it('should remove interpreter and clear the linked participant list on remove interpreter', () => {
        component.ngOnInit();
        component.hearing.participants = [];

        const participants: ParticipantModel[] = [];
        let participant = new ParticipantModel();
        participant.first_name = 'firstname';
        participant.last_name = 'lastname';
        participant.email = 'firstname.lastname@email.com';
        participant.case_role_name = 'Claimant';
        participant.hearing_role_name = 'Litigant in person';
        participants.push(participant);

        participant = new ParticipantModel();
        participant.first_name = 'firstname1';
        participant.last_name = 'lastname1';
        participant.email = 'firstname1.lastname1@email.com';
        participant.case_role_name = 'Claimant';
        participant.hearing_role_name = 'Interpreter';
        participant.interpreterFor = 'firstname.lastname@email.com';
        participants.push(participant);
        component.hearing.participants = participants;

        const lp = new LinkedParticipantModel();
        lp.participantEmail = 'firstname.lastname@email.com';
        lp.linkedParticipantEmail = 'firstname1.lastname1@email.com';
        const lps: LinkedParticipantModel[] = [];
        lps.push(lp);
        component.hearing.linked_participants = lps;

        component.selectedParticipantEmail = 'firstname1.lastname1@email.com';
        component.handleContinueRemoveInterpreter();
        expect(component.hearing.linked_participants).toEqual([]);
        expect(component.hearing.participants.length).toBe(1);
        expect(component.hearing.participants[0].first_name).toBe('firstname');
    });
    it('should save new booking with multi hearings', fakeAsync(async () => {
        component.ngOnInit();
        component.hearing.multiDays = true;
        component.hearing.end_hearing_date_time = new Date(component.hearing.scheduled_date_time);
        component.hearing.end_hearing_date_time.setDate(component.hearing.end_hearing_date_time.getDate() + 7);
        fixture.detectChanges();

        await component.bookHearing().then(() => {
            expect(component.bookingsSaving).toBeTruthy();
            expect(component.showWaitSaving).toBeFalsy();
            expect(routerSpy.navigate).toHaveBeenCalled();
            expect(videoHearingsServiceSpy.saveHearing).toHaveBeenCalled();
            expect(videoHearingsServiceSpy.cloneMultiHearings).toHaveBeenCalled();
        });
    }));

    it('should save new booking with multi hearings - single date', fakeAsync(async () => {
        component.ngOnInit();
        component.hearing.multiDays = true;
        component.hearing.end_hearing_date_time = new Date(component.hearing.scheduled_date_time);
        component.hearing.end_hearing_date_time.setDate(component.hearing.end_hearing_date_time.getDate() + 7);
        component.hearing.hearing_dates = [new Date(component.hearing.scheduled_date_time)];
        fixture.detectChanges();

        await component.bookHearing().then(() => {
            expect(component.bookingsSaving).toBeTruthy();
            expect(component.showWaitSaving).toBeFalsy();
            expect(routerSpy.navigate).toHaveBeenCalled();
            expect(videoHearingsServiceSpy.saveHearing).toHaveBeenCalled();
        });
    }));

    it('should save new booking with multi hearings - multi date', fakeAsync(async () => {
        component.ngOnInit();
        component.hearing.multiDays = true;
        component.hearing.end_hearing_date_time = new Date(component.hearing.scheduled_date_time);
        component.hearing.end_hearing_date_time.setDate(component.hearing.end_hearing_date_time.getDate() + 7);

        const hearingDate = new Date(component.hearing.scheduled_date_time);
        const hearingDatePlusOne = new Date(hearingDate);
        hearingDatePlusOne.setDate(hearingDatePlusOne.getDate() + 1);
        component.hearing.hearing_dates = [hearingDate, hearingDatePlusOne];
        fixture.detectChanges();

        await component.bookHearing().then(() => {
            expect(component.bookingsSaving).toBeTruthy();
            expect(component.showWaitSaving).toBeFalsy();
            expect(routerSpy.navigate).toHaveBeenCalled();
            expect(videoHearingsServiceSpy.saveHearing).toHaveBeenCalled();
            expect(videoHearingsServiceSpy.cloneMultiHearings).toHaveBeenCalled();
        });
    }));

    it('should set error when booking new hearing request fails', fakeAsync(async () => {
        videoHearingsServiceSpy.getStatus.calls.reset();
        videoHearingsServiceSpy.saveHearing.and.throwError('BadRequest');
        await component.bookHearing().then(() => {
            expect(component.showWaitSaving).toBeFalsy();
            expect(videoHearingsServiceSpy.getStatus).toHaveBeenCalledTimes(0);
            expect(videoHearingsServiceSpy.saveHearing).toHaveBeenCalled();
        });
    }));

    it('When booking status false will re-poll', fakeAsync(async () => {
        videoHearingsServiceSpy.getStatus.calls.reset();
        const participants: ParticipantModel[] = [];
        const participant = new ParticipantModel();
        participant.first_name = 'firstname';
        participant.last_name = 'lastname';
        participant.email = 'firstname.lastname@email.com';
        participant.hearing_role_name = 'Litigant in person';
        participant.id = '100';
        participant.is_judge = true;
        participants.push(participant);
        component.hearing.participants = participants;
        const response = {
            id: 'hearing_id',
            status: BookingStatus.Failed,
            created_by: 'test@hmcts.net',
            participants: participants
        } as HearingDetailsResponse;

        videoHearingsServiceSpy.saveHearing.and.returnValue(Promise.resolve(response));

        videoHearingsServiceSpy.getStatus.and.returnValue(Promise.resolve({ success: false } as UpdateBookingStatusResponse));
        component.ngOnInit();
        await component.bookHearing();
        tick(50000);
        expect(videoHearingsServiceSpy.saveHearing).toHaveBeenCalled();
        expect(videoHearingsServiceSpy.getStatus).toHaveBeenCalledWith(response.id);
        expect(videoHearingsServiceSpy.getStatus).toHaveBeenCalledTimes(11);
    }));

    it('When booking status created but not judge assigned', fakeAsync(async () => {
        videoHearingsServiceSpy.getStatus.calls.reset();
        const participants: ParticipantModel[] = [];
        const participant = new ParticipantModel();
        participant.first_name = 'firstname';
        participant.last_name = 'lastname';
        participant.email = 'firstname.lastname@email.com';
        participant.hearing_role_name = 'Litigant in person';
        participant.id = '100';
        participant.is_judge = false;
        participants.push(participant);
        component.hearing.participants = participants;
        const response = {
            id: 'hearing_id',
            status: BookingStatus.Created,
            created_by: 'test@hmcts.net',
            participants: participants
        } as HearingDetailsResponse;

        videoHearingsServiceSpy.saveHearing.and.returnValue(Promise.resolve(response));

        videoHearingsServiceSpy.getStatus.and.returnValue(Promise.resolve({ success: false } as UpdateBookingStatusResponse));

        component.ngOnInit();
        await component.bookHearing();
        tick(50000);
        expect(videoHearingsServiceSpy.saveHearing).toHaveBeenCalled();
        expect(videoHearingsServiceSpy.getStatus).toHaveBeenCalledTimes(0);
    }));

    it('should be able to edit when conference is not about to start and is open', () => {
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
        expect(component.canEdit).toBe(true);
    });

    it('should not be able to edit when conference is about to start and is open', () => {
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
        expect(component.canEdit).toBe(false);
    });

    it('should not able to edit when conference is not about to start and is closed', () => {
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(true);
        expect(component.canEdit).toBe(false);
    });

    it('should not able to edit when conference is about to start and is closed', () => {
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(true);
        expect(component.canEdit).toBe(false);
    });

    it('should call navigate "to add a judge page"', async () => {
        component.ngOnInit();
        component.navToAddJudge();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });
});

describe('SummaryComponent  with invalid request', () => {
    let component: SummaryComponent;
    let fixture: ComponentFixture<SummaryComponent>;

    beforeEach(waitForAsync(() => {
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
            'getHearingTypes',
            'getCurrentRequest',
            'updateHearingRequest',
            'saveHearing',
            'cancelRequest',
            'updateHearing',
            'setBookingHasChanged',
            'cloneMultiHearings'
        ]);
        initExistingHearingRequest();
        const existingRequest = initBadHearingRequest();
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
        videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));

        const validationProblem = new ValidationProblemDetails({
            errors: {
                FirstName: ['First name is required'],
                LastName: ['Last Name is required'],
                ContactEmail: ['Contact Email is required']
            },
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
            title: 'One or more validation errors occurred.',
            status: 400
        });

        videoHearingsServiceSpy.saveHearing.and.throwError(
            new BookHearingException('Bad Request', 400, 'One or more validation errors occurred.', null, validationProblem)
        );

        TestBed.configureTestingModule({
            providers: [
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: Logger, useValue: loggerSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                { provide: BookingStatusService, useValue: bookingStatusService }
            ],
            imports: [RouterTestingModule],
            declarations: [
                SummaryComponent,
                BreadcrumbStubComponent,
                CancelPopupComponent,
                ParticipantsListStubComponent,
                BookingEditStubComponent,
                RemovePopupComponent,
                WaitPopupComponent,
                SaveFailedPopupComponent,
                LongDatetimePipe,
                RemoveInterpreterPopupComponent,
                TruncatableTextComponent
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should display save failed message', async () => {
        await component.bookHearing();
        expect(component.showErrorSaving).toBeTruthy();
        expect(component.showWaitSaving).toBeFalsy();
    });

    it('should not save booking, when no judge assigned and Ejud flag off', async () => {
        component.ngOnInit();
        fixture.detectChanges();
        component.ejudFeatureFlag = false;
        await component.bookHearing();
        expect(videoHearingsServiceSpy.saveHearing).toHaveBeenCalledTimes(0);
        expect(component.showWaitSaving).toBeFalsy();
        expect(component.showErrorSaving).toBeTruthy();
    });
});

describe('SummaryComponent  with existing request', () => {
    let component: SummaryComponent;
    let fixture: ComponentFixture<SummaryComponent>;

    beforeEach(waitForAsync(() => {
        const existingRequest = initExistingHearingRequest();
        existingRequest.hearing_id = '12345ty';
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
        videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
        videoHearingsServiceSpy.updateHearing.and.returnValue(of(new HearingDetailsResponse()));

        TestBed.configureTestingModule({
            providers: [
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: Logger, useValue: loggerSpy },
                { provide: RecordingGuardService, useValue: recordingGuardServiceSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                { provide: BookingStatusService, useValue: bookingStatusService }
            ],
            imports: [RouterTestingModule],
            declarations: [
                SummaryComponent,
                BreadcrumbStubComponent,
                CancelPopupComponent,
                ParticipantsListStubComponent,
                BookingEditStubComponent,
                RemovePopupComponent,
                WaitPopupComponent,
                SaveFailedPopupComponent,
                LongDatetimePipe,
                TruncatableTextComponent
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        const mockSessionStorage = {
            getItem: (key: string): string => 'true',
            setItem: (key: string, value: string) => {},
            removeItem: (key: string) => {},
            clear: () => {}
        };
        spyOn(sessionStorage, 'setItem').and.callFake(mockSessionStorage.setItem);
    });

    it('should indicate that the current booking is existing booking', () => {
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.isExistingBooking).toBeTruthy();
    });
    it('should retrieve hearing data', () => {
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.caseNumber).toBe('TX/12345/2018');
        expect(component.caseName).toBe('Mr. Test User vs HMRC');
        expect(component.caseHearingType).toBe('Automated Test');
        expect(component.courtRoomAddress).toBeTruthy();
        expect(component.hearingDuration).toBe('listed for 1 hour 20 minutes');
    });
    it('should hide pop up if continue booking pressed', () => {
        component.continueBooking();
        fixture.detectChanges();
        expect(component.attemptingCancellation).toBeFalsy();
    });
    it('should show pop up if booking is canceling', () => {
        component.confirmCancelBooking();
        fixture.detectChanges();
        expect(component.attemptingCancellation).toBeTruthy();
    });
    it('should hide pop up if booking is canceled', () => {
        component.cancelBooking();
        fixture.detectChanges();
        expect(component.attemptingCancellation).toBeFalsy();
        expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });
    it('should update booking', () => {
        component.ngOnInit();
        fixture.detectChanges();

        component.bookHearing();
        expect(component.bookingsSaving).toBeTruthy();
        expect(component.showWaitSaving).toBeFalsy();
        expect(routerSpy.navigate).toHaveBeenCalled();
        expect(sessionStorage.setItem).toHaveBeenCalled();

        expect(videoHearingsServiceSpy.updateHearing).toHaveBeenCalled();
    });

    it('should set error when update booking request fails', () => {
        const response = {
            id: 'hearing_id',
            status: BookingStatus.Failed
        } as HearingDetailsResponse;

        videoHearingsServiceSpy.updateHearing.and.returnValue(of(response));
        component.updateHearing();

        expect(component.showWaitSaving).toBeFalsy();
        expect(component.hearing.hearing_id).toEqual('hearing_id');
    });

    it('should remove existing participant', () => {
        component.hearing = initExistingHearingRequest();
        component.hearing.hearing_id = '12345';
        component.hearing.participants[0].id = '678';
        component.selectedParticipantEmail = 'aa@hmcts.net';
        component.removeParticipant();
        fixture.detectChanges();
        expect(loggerSpy.info).toHaveBeenCalled();
    });
    it('should remove existing endpoint', () => {
        component.hearing = initExistingHearingRequest();
        component.hearing.hearing_id = '12345';
        component.hearing.endpoints = [];
        const ep1 = new EndpointModel();
        ep1.displayName = 'test endpoint 001';
        const ep2 = new EndpointModel();
        ep2.displayName = 'test endpoint 002';
        const ep3 = new EndpointModel();
        ep3.displayName = 'test endpoint 003';
        component.hearing.endpoints.push(ep1);
        component.hearing.endpoints.push(ep2);
        component.hearing.endpoints.push(ep3);

        component.removeEndpoint(1);
        expect(component.hearing.endpoints.length).toBe(2);
        expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
    });
    it('it should display the participant and representee', () => {
        component.hearing = initExistingHearingRequest();
        const result = component.getDefenceAdvocateByContactEmail(
            component.hearing.participants.find(x => x.id === '123123-123').contact_email
        );
        expect(result).toBe('solicitor 01, representing citizen 01');
    });
    it('it should display the participant and representee', () => {
        component.hearing = initExistingHearingRequest();
        const result = component.getDefenceAdvocateByContactEmail('madeup@doesnotexist.com');
        expect(result).toBe('');
    });
    it('should remove an existing interpretee and interpreter', () => {
        component.hearing = initExistingHearingRequest();
        component.hearing.participants = [];

        const linkedParticipants: LinkedParticipantModel[] = [];
        const lp = new LinkedParticipantModel();
        lp.linkType = LinkedParticipantType.Interpreter;
        lp.linkedParticipantId = '200';
        linkedParticipants.push(lp);
        const participants: ParticipantModel[] = [];
        let participant = new ParticipantModel();
        participant.first_name = 'firstname';
        participant.last_name = 'lastname';
        participant.email = 'firstname.lastname@email.com';
        participant.case_role_name = 'Claimant';
        participant.hearing_role_name = 'Litigant in person';
        participant.id = '100';
        participant.linked_participants = linkedParticipants;
        participants.push(participant);

        const linkedParticipants1: LinkedParticipantModel[] = [];
        const lp1 = new LinkedParticipantModel();
        lp1.linkType = LinkedParticipantType.Interpreter;
        lp1.linkedParticipantId = '100';
        linkedParticipants1.push(lp1);
        participant = new ParticipantModel();
        participant.first_name = 'firstname1';
        participant.last_name = 'lastname1';
        participant.email = 'firstname1.lastname1@email.com';
        participant.case_role_name = 'Claimant';
        participant.hearing_role_name = 'Interpreter';
        participant.interpreterFor = '';
        participant.id = '200';
        participant.linked_participants = linkedParticipants1;
        participants.push(participant);
        component.hearing.participants = participants;

        const lp3 = new LinkedParticipantModel();
        lp3.participantEmail = 'firstname.lastname@email.com';
        lp3.linkedParticipantEmail = 'firstname1.lastname1@email.com';
        lp3.linkedParticipantId = '200';
        const lps: LinkedParticipantModel[] = [];
        lps.push(lp3);
        component.hearing.linked_participants = lps;

        component.selectedParticipantEmail = 'firstname1.lastname1@email.com';
        component.handleContinueRemoveInterpreter();
        expect(component.hearing.linked_participants).toEqual([]);
        expect(component.hearing.participants.length).toBe(0);
    });
});

describe('SummaryComponent  with multi days request', () => {
    const bookingServiceSpy = jasmine.createSpyObj<BookingService>('BookingService', ['removeParticipantEmail']);
    recordingGuardServiceSpy = jasmine.createSpyObj<RecordingGuardService>('RecordingGuardService', [
        'switchOffRecording',
        'mandatoryRecordingForHearingRole'
    ]);
    const existingRequest = initExistingHearingRequest();
    existingRequest.multiDays = true;
    existingRequest.hearing_id = '12345ty';
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
    videoHearingsServiceSpy.updateHearing.and.returnValue(of(new HearingDetailsResponse()));
    const participantServiceSpy = jasmine.createSpyObj<ParticipantService>('ParticipantService', ['removeParticipant']);
    launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.eJudFeature).and.returnValue(of(true));

    const component = new SummaryComponent(
        videoHearingsServiceSpy,
        routerSpy,
        bookingServiceSpy,
        loggerSpy,
        recordingGuardServiceSpy,
        participantServiceSpy,
        launchDarklyServiceSpy,
        bookingStatusService
    );
    component.participantsListComponent = new ParticipantListComponent(loggerSpy, videoHearingsServiceSpy);
    component.removeInterpreterPopupComponent = new RemoveInterpreterPopupComponent();
    component.removePopupComponent = new RemovePopupComponent();

    it('should display summary data from existing hearing with multi days', () => {
        component.hearing = existingRequest;
        component.hearing.end_hearing_date_time = new Date(component.hearing.scheduled_date_time);
        component.hearing.end_hearing_date_time.setDate(component.hearing.end_hearing_date_time.getDate() + 7);
        component.ngOnInit();

        expect(new Date(component.hearingDate).getDate()).toEqual(new Date(existingRequest.scheduled_date_time).getDate());
        expect(new Date(component.endHearingDate).getDate()).toEqual(new Date(existingRequest.end_hearing_date_time).getDate());

        expect(new Date(component.hearingDate).getMonth()).toEqual(new Date(existingRequest.scheduled_date_time).getMonth());
        expect(new Date(component.endHearingDate).getMonth()).toEqual(new Date(existingRequest.end_hearing_date_time).getMonth());

        expect(new Date(component.hearingDate).getFullYear()).toEqual(new Date(existingRequest.scheduled_date_time).getFullYear());
        expect(new Date(component.endHearingDate).getFullYear()).toEqual(new Date(existingRequest.end_hearing_date_time).getFullYear());
    });

    it('should confirm remove participant', fakeAsync(() => {
        component.ngOnInit();

        const linkedParticipants: LinkedParticipantModel[] = [];
        const lp = new LinkedParticipantModel();
        lp.linkType = LinkedParticipantType.Interpreter;
        lp.linkedParticipantId = '200';
        linkedParticipants.push(lp);
        const participants: ParticipantModel[] = [];
        let participant = new ParticipantModel();
        participant.first_name = 'firstname';
        participant.last_name = 'lastname';
        participant.email = 'firstname.lastname@email.com';
        participant.case_role_name = 'Claimant';
        participant.hearing_role_name = 'Litigant in person';
        participant.id = '100';
        participant.linked_participants = linkedParticipants;
        participants.push(participant);

        const linkedParticipants1: LinkedParticipantModel[] = [];
        const lp1 = new LinkedParticipantModel();
        lp1.linkType = LinkedParticipantType.Interpreter;
        lp1.linkedParticipantId = '100';
        linkedParticipants1.push(lp1);
        participant = new ParticipantModel();
        participant.first_name = 'firstname1';
        participant.last_name = 'lastname1';
        participant.email = 'firstname1.lastname1@email.com';
        participant.case_role_name = 'Claimant';
        participant.hearing_role_name = 'Interpreter';
        participant.interpreterFor = '';
        participant.id = '200';
        participant.linked_participants = linkedParticipants1;
        participants.push(participant);
        component.hearing.participants = participants;

        const participantList = component.participantsListComponent;
        participantList.removeParticipant({
            email: 'firstname.lastname@email.com',
            is_exist_person: false,
            is_judge: false
        });
        participantList.selectedParticipant.emit();
        tick(600);
        expect(component.showConfirmRemoveInterpretee).toBe(true);
        participantList.removeParticipant({
            email: 'firstname1.lastname1@email.com',
            is_exist_person: false,
            is_judge: false
        });
        participantList.selectedParticipant.emit();
        tick(600);
        expect(component.showConfirmationRemoveParticipant).toBe(true);
    }));
});
