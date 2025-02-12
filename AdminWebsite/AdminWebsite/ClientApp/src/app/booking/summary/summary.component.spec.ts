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
import { RemovePopupComponent } from '../../popups/remove-popup/remove-popup.component';
import { WaitPopupComponent } from '../../popups/wait-popup/wait-popup.component';
import { BookingService } from '../../services/booking.service';
import {
    BookHearingException,
    BookingStatus,
    HearingDetailsResponse,
    JudiciaryParticipantResponse,
    MultiHearingRequest,
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
import { ReferenceDataService } from 'src/app/services/reference-data.service';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { VHParticipant } from 'src/app/common/model/vh-participant';
import { JudicialMemberDto } from '../judicial-office-holders/models/add-judicial-member.model';
import { CaseTypeModel } from 'src/app/common/model/case-type.model';

function initExistingHearingRequest(): VHBooking {
    const pat1 = new VHParticipant();
    pat1.email = 'aa@hmcts.net';
    pat1.representee = 'citizen 01';
    pat1.displayName = 'solicitor 01';
    pat1.id = '123123-123';

    const today = new Date();
    today.setHours(14, 30);

    const newCaseRequest = new CaseModel();
    newCaseRequest.name = 'Mr. Test User vs HMRC';
    newCaseRequest.number = 'TX/12345/2018';

    const existingRequest = new VHBooking();
    existingRequest.case = newCaseRequest;
    existingRequest.hearingVenueId = 2;
    existingRequest.scheduledDateTime = today;
    existingRequest.scheduledDuration = 80;
    existingRequest.otherInformation = '|OtherInformation|some notes';
    existingRequest.audioRecordingRequired = true;
    existingRequest.courtRoom = '123W';
    const courtString = MockValues.Courts.find(c => c.id === existingRequest.hearingVenueId).name;
    existingRequest.courtName = courtString;
    existingRequest.isMultiDayEdit = false;
    existingRequest.endHearingDateTime = new Date(addDays(Date.now(), 7));
    existingRequest.caseType = ResponseTestData.getCaseTypeModelTestData();

    existingRequest.participants = [];
    existingRequest.participants.push(pat1);
    return existingRequest;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function initBadHearingRequest(): VHBooking {
    const today = new Date();
    today.setHours(14, 30);

    const newCaseRequest = new CaseModel();
    newCaseRequest.name = 'Mr. Test User vs HMRC';
    newCaseRequest.number = 'TX/12345/2018';

    const existingRequest = new VHBooking();
    existingRequest.case = newCaseRequest;
    existingRequest.hearingVenueId = 2;
    existingRequest.scheduledDateTime = today;
    existingRequest.scheduledDuration = 80;
    existingRequest.caseType = ResponseTestData.getCaseTypeModelTestData();
    return existingRequest;
}

let recordingGuardServiceSpy: jasmine.SpyObj<RecordingGuardService>;
const stringifier = new PipeStringifierService();

const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'url']);
const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'info', 'warn', 'debug']);
recordingGuardServiceSpy = jasmine.createSpyObj<RecordingGuardService>('RecordingGuardService', ['mandatoryRecordingForHearingRole']);

const refDataServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService', ['getCaseTypes']);
const videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService> = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
    'getCurrentRequest',
    'updateHearingRequest',
    'saveHearing',
    'cancelRequest',
    'updateHearing',
    'setBookingHasChanged',
    'unsetBookingHasChanged',
    'cloneMultiHearings',
    'isConferenceClosed',
    'isHearingAboutToStart',
    'getStatus',
    'updateFailedStatus',
    'updateMultiDayHearing',
    'isBookingServiceDegraded'
]);
videoHearingsServiceSpy.isBookingServiceDegraded.and.returnValue(of(false));
const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(true));
launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.interpreterEnhancements).and.returnValue(of(false));
launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.specialMeasures).and.returnValue(of(false));
const bookingStatusService = new BookingStatusService(videoHearingsServiceSpy);

describe('SummaryComponent with valid request', () => {
    let component: SummaryComponent;
    let fixture: ComponentFixture<SummaryComponent>;

    let existingRequest: VHBooking;

    beforeEach(waitForAsync(() => {
        existingRequest = initExistingHearingRequest();

        const mockResp = new UpdateBookingStatusResponse();
        mockResp.success = true;
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
        refDataServiceSpy.getCaseTypes.and.returnValue(of(MockValues.CaseTypesList));
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
        videoHearingsServiceSpy.cloneMultiHearings.calls.reset();
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
        component.hearing.isMultiDayEdit = true;
        component.hearing.endHearingDateTime = new Date(component.hearing.scheduledDateTime);
        component.hearing.endHearingDateTime.setDate(component.hearing.endHearingDateTime.getDate() + 7);
        component.hearing.hearingDates = [new Date(component.hearing.scheduledDateTime), new Date(component.hearing.endHearingDateTime)];
        const hearingDetailsResponse = new HearingDetailsResponse({
            id: component.hearing.hearingId
        });
        fixture.detectChanges();

        await component.processBooking(hearingDetailsResponse, hearingStatusResponse);

        expect(videoHearingsServiceSpy.cloneMultiHearings).toHaveBeenCalledWith(
            hearingDetailsResponse.id,
            new MultiHearingRequest({
                hearing_dates: component.hearing.hearingDates.map(date => new Date(date)),
                scheduled_duration: component.hearing.scheduledDuration
            })
        );
    });

    it(
        'Call ProcessBooking when hearingStatusResponse has succeeded and it is not Multiple Individual HearingDates ' +
            'and is hearing date range',
        async () => {
            // arrange
            const hearingStatusResponse = { success: true };
            component.hearing.isMultiDayEdit = true;
            component.hearing.hearingDates = [];
            const hearingDetailsResponse = new HearingDetailsResponse({
                id: component.hearing.hearingId
            });
            fixture.detectChanges();

            await component.processBooking(hearingDetailsResponse, hearingStatusResponse);

            expect(videoHearingsServiceSpy.cloneMultiHearings).toHaveBeenCalledWith(
                hearingDetailsResponse.id,
                new MultiHearingRequest({
                    start_date: new Date(component.hearing.scheduledDateTime),
                    end_date: new Date(component.hearing.endHearingDateTime),
                    scheduled_duration: component.hearing.scheduledDuration
                })
            );
        }
    );

    it(
        'Call ProcessBooking when hearingStatusResponse has succeeded and it is not Multiple Individual HearingDates ' +
            'and is not hearing date range',
        async () => {
            // arrange
            const hearingStatusResponse = { success: true };
            const hearingDetailsResponse = { id: 'mock hearing Id' };
            component.hearing.isMultiDayEdit = true;
            component.hearing.hearingDates = [new Date(component.hearing.scheduledDateTime)];

            fixture.detectChanges();

            await component.processBooking(hearingDetailsResponse, hearingStatusResponse);
            const message = '[Booking] - [Summary] - Hearing has just one day, no remaining days to book';
            expect(loggerSpy.info).toHaveBeenCalledWith(
                message,
                Object({
                    hearingId: hearingDetailsResponse.id,
                    caseName: component.hearing.case.name,
                    caseNumber: component.hearing.case.number
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
        expect(component.caseNumber).toEqual(existingRequest.case.number);
        expect(component.caseName).toEqual(existingRequest.case.name);
        expect(component.otherInformation.OtherInformation).toEqual(
            stringifier.decode<OtherInformationModel>(existingRequest.otherInformation).OtherInformation
        );
        expect(component.hearing.scheduledDateTime).toEqual(existingRequest.scheduledDateTime);
        const courtString = MockValues.Courts.find(c => c.id === existingRequest.hearingVenueId);
        expect(component.hearing.courtRoomAddress).toEqual(`${courtString.name}, 123W`);
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
        const pat1 = new VHParticipant();
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
    it('should set audio recording to false if recording is not allowed for case type', () => {
        component.hearing.caseType = new CaseTypeModel({
            name: 'Court of Appeal Criminal Division',
            isAudioRecordingAllowed: false
        });
        component.ngOnInit();
        expect(component.hearing.audioRecordingRequired).toBe(false);
    });
    it('should set audio recording to true if an interpreter is present', () => {
        component.hasParticipantsRequiringAudioRecording = true;
        component.isAudioRecordingRequired();
        fixture.detectChanges();
        expect(component.hearing.audioRecordingRequired).toBe(true);
    });
    it('should set audio recording to false if recording is not allowed for case type and an interpreter is present', () => {
        component.hearing.caseType = new CaseTypeModel({
            name: 'Court of Appeal Criminal Division',
            isAudioRecordingAllowed: false
        });
        component.hasParticipantsRequiringAudioRecording = true;
        component.isAudioRecordingRequired();
        component.ngOnInit();
        expect(component.hearing.audioRecordingRequired).toBe(false);
    });
    it('should display valid court address when room number is empty', () => {
        component.hearing.courtRoom = '';
        component.ngOnInit();
        fixture.detectChanges();
        const courtString = MockValues.Courts.find(c => c.id === existingRequest.hearingVenueId);
        expect(component.hearing.courtRoomAddress).toEqual(`${courtString.name}`);
    });
    it('should display valid audio recording selected option', () => {
        component.hearing.audioRecordingRequired = false;
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.hearing.audioChoice).toBe('No');
    });
    it('should remove interpretee and interpreter and clear the linked participant list on remove interpretee', () => {
        component.ngOnInit();
        component.hearing.participants = [];

        const participants: VHParticipant[] = [];
        let participant = new VHParticipant();
        participant.firstName = 'firstname';
        participant.lastName = 'lastname';
        participant.email = 'firstname.lastname@email.com';
        participant.hearingRoleName = 'Litigant in person';
        participants.push(participant);

        participant = new VHParticipant();
        participant.firstName = 'firstname1';
        participant.lastName = 'lastname1';
        participant.email = 'firstname1.lastname1@email.com';
        participant.hearingRoleName = 'Interpreter';
        participant.interpreterFor = 'firstname.lastname@email.com';
        participants.push(participant);
        component.hearing.participants = participants;

        const lp = new LinkedParticipantModel();
        lp.participantEmail = 'firstname.lastname@email.com';
        lp.linkedParticipantEmail = 'firstname1.lastname1@email.com';
        const lps: LinkedParticipantModel[] = [];
        lps.push(lp);
        component.hearing.linkedParticipants = lps;
        component.selectedParticipantEmail = 'firstname.lastname@email.com';

        component.handleContinueRemoveInterpreter();
        expect(component.hearing.linkedParticipants).toEqual([]);
        expect(component.hearing.participants).toEqual([]);
    });

    it('should remove interpreter and clear the linked participant list on remove interpreter', () => {
        component.ngOnInit();
        component.hearing.participants = [];

        const participants: VHParticipant[] = [];
        let participant = new VHParticipant();
        participant.firstName = 'firstname';
        participant.lastName = 'lastname';
        participant.email = 'firstname.lastname@email.com';
        participant.hearingRoleName = 'Litigant in person';
        participants.push(participant);

        participant = new VHParticipant();
        participant.firstName = 'firstname1';
        participant.lastName = 'lastname1';
        participant.email = 'firstname1.lastname1@email.com';
        participant.hearingRoleName = 'Interpreter';
        participant.interpreterFor = 'firstname.lastname@email.com';
        participants.push(participant);
        component.hearing.participants = participants;

        const lp = new LinkedParticipantModel();
        lp.participantEmail = 'firstname.lastname@email.com';
        lp.linkedParticipantEmail = 'firstname1.lastname1@email.com';
        const lps: LinkedParticipantModel[] = [];
        lps.push(lp);
        component.hearing.linkedParticipants = lps;

        component.selectedParticipantEmail = 'firstname1.lastname1@email.com';
        component.handleContinueRemoveInterpreter();
        expect(component.hearing.linkedParticipants).toEqual([]);
        expect(component.hearing.participants.length).toBe(1);
        expect(component.hearing.participants[0].firstName).toBe('firstname');
    });
    it('should save new booking with multi hearings - zero scheduled duration', fakeAsync(async () => {
        component.ngOnInit();
        component.hearing.isMultiDayEdit = true;
        component.hearing.endHearingDateTime = new Date(component.hearing.scheduledDateTime);
        component.hearing.endHearingDateTime.setDate(component.hearing.endHearingDateTime.getDate() + 7);
        component.hearing.scheduledDuration = 0;
        fixture.detectChanges();

        await component.bookHearing().then(() => {
            expect(component.bookingsSaving).toBeTruthy();
            expect(component.showWaitSaving).toBeFalsy();
            expect(routerSpy.navigate).toHaveBeenCalled();
            expect(videoHearingsServiceSpy.saveHearing).toHaveBeenCalled();
            expect(videoHearingsServiceSpy.cloneMultiHearings).toHaveBeenCalledWith(
                jasmine.any(String),
                jasmine.objectContaining({
                    scheduled_duration: 480
                })
            );
        });
    }));

    it('should save new booking with multi hearings - nonzero scheduled duration', fakeAsync(async () => {
        component.ngOnInit();
        component.hearing.isMultiDayEdit = true;
        component.hearing.endHearingDateTime = new Date(component.hearing.scheduledDateTime);
        component.hearing.endHearingDateTime.setDate(component.hearing.endHearingDateTime.getDate() + 7);
        const scheduledDuration = 120;
        component.hearing.scheduledDuration = scheduledDuration;
        fixture.detectChanges();

        await component.bookHearing().then(() => {
            expect(component.bookingsSaving).toBeTruthy();
            expect(component.showWaitSaving).toBeFalsy();
            expect(routerSpy.navigate).toHaveBeenCalled();
            expect(videoHearingsServiceSpy.saveHearing).toHaveBeenCalled();
            expect(videoHearingsServiceSpy.cloneMultiHearings).toHaveBeenCalledWith(
                jasmine.any(String),
                jasmine.objectContaining({
                    scheduled_duration: scheduledDuration
                })
            );
        });
    }));

    it('should save new booking with multi hearings - single date', fakeAsync(async () => {
        component.ngOnInit();
        component.hearing.isMultiDayEdit = true;
        component.hearing.endHearingDateTime = new Date(component.hearing.scheduledDateTime);
        component.hearing.endHearingDateTime.setDate(component.hearing.endHearingDateTime.getDate() + 7);
        component.hearing.hearingDates = [new Date(component.hearing.scheduledDateTime)];
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
        component.hearing.isMultiDayEdit = true;
        component.hearing.endHearingDateTime = new Date(component.hearing.scheduledDateTime);
        component.hearing.endHearingDateTime.setDate(component.hearing.endHearingDateTime.getDate() + 7);

        const hearingDate = new Date(component.hearing.scheduledDateTime);
        const hearingDatePlusOne = new Date(hearingDate);
        hearingDatePlusOne.setDate(hearingDatePlusOne.getDate() + 1);
        component.hearing.hearingDates = [hearingDate, hearingDatePlusOne];
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
        const judiciaryParticipants: JudiciaryParticipantResponse[] = [];
        const judge = new JudiciaryParticipantResponse({
            first_name: 'firstname',
            last_name: 'lastname',
            full_name: 'fullname',
            email: 'firstname.lastname@email.com',
            personal_code: 'personalCode',
            role_code: 'Judge'
        });
        judiciaryParticipants.push(judge);
        const mappedJudiciaryParticipants = judiciaryParticipants.map(j => JudicialMemberDto.fromJudiciaryParticipantResponse(j));
        component.hearing.judiciaryParticipants = mappedJudiciaryParticipants;
        const response = {
            id: 'hearing_id',
            status: BookingStatus.Failed,
            created_by: 'test@hmcts.net',
            judiciary_participants: judiciaryParticipants
        } as unknown as HearingDetailsResponse;

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
        const participants: VHParticipant[] = [];
        const participant = new VHParticipant();
        participant.firstName = 'firstname';
        participant.lastName = 'lastname';
        participant.email = 'firstname.lastname@email.com';
        participant.hearingRoleName = 'Litigant in person';
        participant.id = '100';
        participants.push(participant);
        component.hearing.participants = participants;
        const response = {
            id: 'hearing_id',
            status: BookingStatus.Created,
            created_by: 'test@hmcts.net',
            participants: participants
        } as unknown as HearingDetailsResponse;

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

    it('should disable saving, if the booking service is degraded', async () => {
        // arrange
        videoHearingsServiceSpy.isBookingServiceDegraded.and.returnValue(of(true));
        component.ngOnInit();
        fixture.detectChanges();
        // check if the save button is disabled
        const saveButton = fixture.nativeElement.querySelector('#bookButton');
        expect(saveButton.disabled).toBeTrue();
    });
});

describe('SummaryComponent  with invalid request', () => {
    let component: SummaryComponent;
    let fixture: ComponentFixture<SummaryComponent>;

    beforeEach(waitForAsync(() => {
        videoHearingsServiceSpy.saveHearing.calls.reset();
        initExistingHearingRequest();
        const existingRequest = initBadHearingRequest();
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
        refDataServiceSpy.getCaseTypes.and.returnValue(of(MockValues.CaseTypesList));

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
});

describe('SummaryComponent  with existing request', () => {
    let component: SummaryComponent;
    let fixture: ComponentFixture<SummaryComponent>;

    beforeEach(waitForAsync(() => {
        const existingRequest = initExistingHearingRequest();
        existingRequest.hearingId = '12345ty';
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
        refDataServiceSpy.getCaseTypes.and.returnValue(of(MockValues.CaseTypesList));
        videoHearingsServiceSpy.updateHearing.and.returnValue(of(new HearingDetailsResponse()));
        videoHearingsServiceSpy.updateMultiDayHearing.and.returnValue(of(new HearingDetailsResponse()));

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
        expect(component.hearing.courtRoomAddress).toBeTruthy();
        expect(component.hearing.hearingDuration).toBe('listed for 1 hour 20 minutes');
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
    describe('bookHearing', () => {
        it('should update booking when editing a single day hearing with multi day booking enhancements disabled', () => {
            component.hearing.isMultiDayEdit = false;
            launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));
            component.ngOnInit();
            fixture.detectChanges();

            component.bookHearing();
            expect(videoHearingsServiceSpy.updateHearing).toHaveBeenCalled();
            assertBookingUpdated();
        });
        it('should update booking when editing a multi day hearing with multi day booking enhancements enabled', () => {
            component.hearing.isMultiDayEdit = true;
            const lastDayScheduledTime = new Date();
            lastDayScheduledTime.setDate(lastDayScheduledTime.getDate() + 2);
            component.hearing.multiDayHearingLastDayScheduledDateTime = lastDayScheduledTime;
            launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(true));
            component.ngOnInit();
            fixture.detectChanges();

            component.bookHearing();
            expect(videoHearingsServiceSpy.updateMultiDayHearing).toHaveBeenCalled();
            assertBookingUpdated();
        });
        it('should update booking when editing a multi day hearing with multi day booking enhancements disabled', () => {
            component.hearing.isMultiDayEdit = false;
            const lastDayScheduledTime = new Date();
            lastDayScheduledTime.setDate(lastDayScheduledTime.getDate() + 2);
            component.hearing.multiDayHearingLastDayScheduledDateTime = lastDayScheduledTime;
            launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));
            component.ngOnInit();
            fixture.detectChanges();

            component.bookHearing();
            expect(videoHearingsServiceSpy.updateHearing).toHaveBeenCalled();
            assertBookingUpdated();
        });
        function assertBookingUpdated() {
            expect(component.bookingsSaving).toBeTruthy();
            expect(component.showWaitSaving).toBeFalsy();
            expect(routerSpy.navigate).toHaveBeenCalled();
            expect(sessionStorage.setItem).toHaveBeenCalled();
        }
    });

    it('should set error when update booking request fails', () => {
        const response = {
            id: 'hearing_id',
            status: BookingStatus.Failed
        } as HearingDetailsResponse;

        videoHearingsServiceSpy.updateHearing.and.returnValue(of(response));
        component.updateHearing();

        expect(component.showWaitSaving).toBeFalsy();
        expect(component.hearing.hearingId).toEqual('hearing_id');
    });

    it('should remove existing participant', () => {
        component.hearing = initExistingHearingRequest();
        component.hearing.hearingId = '12345';
        component.hearing.participants[0].id = '678';
        component.selectedParticipantEmail = 'aa@hmcts.net';
        component.removeParticipant();
        fixture.detectChanges();
        expect(loggerSpy.info).toHaveBeenCalled();
    });
    it('should remove existing endpoint', () => {
        component.hearing = initExistingHearingRequest();
        component.hearing.hearingId = '12345';
        component.hearing.endpoints = [];
        const ep1 = new EndpointModel(null);
        ep1.displayName = 'test endpoint 001';
        const ep2 = new EndpointModel(null);
        ep2.displayName = 'test endpoint 002';
        const ep3 = new EndpointModel(null);
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
        const result = component.getDefenceAdvocateByContactEmail(component.hearing.participants.find(x => x.id === '123123-123').email);
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
        const participants: VHParticipant[] = [];
        let participant = new VHParticipant();
        participant.firstName = 'firstname';
        participant.lastName = 'lastname';
        participant.email = 'firstname.lastname@email.com';
        participant.hearingRoleName = 'Litigant in person';
        participant.id = '100';
        participant.linkedParticipants = linkedParticipants;
        participants.push(participant);

        const linkedParticipants1: LinkedParticipantModel[] = [];
        const lp1 = new LinkedParticipantModel();
        lp1.linkType = LinkedParticipantType.Interpreter;
        lp1.linkedParticipantId = '100';
        linkedParticipants1.push(lp1);
        participant = new VHParticipant();
        participant.firstName = 'firstname1';
        participant.lastName = 'lastname1';
        participant.email = 'firstname1.lastname1@email.com';
        participant.hearingRoleName = 'Interpreter';
        participant.interpreterFor = '';
        participant.id = '200';
        participant.linkedParticipants = linkedParticipants1;
        participants.push(participant);
        component.hearing.participants = participants;

        const lp3 = new LinkedParticipantModel();
        lp3.participantEmail = 'firstname.lastname@email.com';
        lp3.linkedParticipantEmail = 'firstname1.lastname1@email.com';
        lp3.linkedParticipantId = '200';
        const lps: LinkedParticipantModel[] = [];
        lps.push(lp3);
        component.hearing.linkedParticipants = lps;

        component.selectedParticipantEmail = 'firstname1.lastname1@email.com';
        component.handleContinueRemoveInterpreter();
        expect(component.hearing.linkedParticipants).toEqual([]);
        expect(component.hearing.participants.length).toBe(0);
    });
});

describe('SummaryComponent  with multi days request', () => {
    const bookingServiceSpy = jasmine.createSpyObj<BookingService>('BookingService', ['removeParticipantEmail']);
    const ldServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
    ldServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(true));
    ldServiceSpy.getFlag.withArgs(FeatureFlags.interpreterEnhancements).and.returnValue(of(false));
    recordingGuardServiceSpy = jasmine.createSpyObj<RecordingGuardService>('RecordingGuardService', ['mandatoryRecordingForHearingRole']);
    const existingRequest = initExistingHearingRequest();
    existingRequest.isMultiDayEdit = true;
    existingRequest.hearingId = '12345ty';
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
    refDataServiceSpy.getCaseTypes.and.returnValue(of(MockValues.CaseTypesList));
    videoHearingsServiceSpy.updateHearing.and.returnValue(of(new HearingDetailsResponse()));
    const participantServiceSpy = jasmine.createSpyObj<ParticipantService>('ParticipantService', ['removeParticipant']);

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
    component.participantsListComponent = new ParticipantListComponent(videoHearingsServiceSpy, ldServiceSpy);
    component.removeInterpreterPopupComponent = new RemoveInterpreterPopupComponent();
    component.removePopupComponent = new RemovePopupComponent();

    it('should display summary data from existing hearing with multi days', () => {
        component.hearing = existingRequest;
        component.hearing.endHearingDateTime = new Date(component.hearing.scheduledDateTime);
        component.hearing.endHearingDateTime.setDate(component.hearing.endHearingDateTime.getDate() + 7);
        component.ngOnInit();

        expect(new Date(component.hearing.scheduledDateTime).getDate()).toEqual(new Date(existingRequest.scheduledDateTime).getDate());
        expect(new Date(component.endHearingDate).getDate()).toEqual(new Date(existingRequest.endHearingDateTime).getDate());

        expect(new Date(component.hearing.scheduledDateTime).getMonth()).toEqual(new Date(existingRequest.scheduledDateTime).getMonth());
        expect(new Date(component.endHearingDate).getMonth()).toEqual(new Date(existingRequest.endHearingDateTime).getMonth());

        expect(new Date(component.hearing.scheduledDateTime).getFullYear()).toEqual(
            new Date(existingRequest.scheduledDateTime).getFullYear()
        );
        expect(new Date(component.endHearingDate).getFullYear()).toEqual(new Date(existingRequest.endHearingDateTime).getFullYear());
    });

    it('should confirm remove participant', fakeAsync(() => {
        component.ngOnInit();

        const linkedParticipants: LinkedParticipantModel[] = [];
        const lp = new LinkedParticipantModel();
        lp.linkType = LinkedParticipantType.Interpreter;
        lp.linkedParticipantId = '200';
        linkedParticipants.push(lp);
        const participants: VHParticipant[] = [];
        let participant = new VHParticipant();
        participant.firstName = 'firstname';
        participant.lastName = 'lastname';
        participant.email = 'firstname.lastname@email.com';
        participant.hearingRoleName = 'Litigant in person';
        participant.id = '100';
        participant.linkedParticipants = linkedParticipants;
        participants.push(participant);

        const linkedParticipants1: LinkedParticipantModel[] = [];
        const lp1 = new LinkedParticipantModel();
        lp1.linkType = LinkedParticipantType.Interpreter;
        lp1.linkedParticipantId = '100';
        linkedParticipants1.push(lp1);
        participant = new VHParticipant();
        participant.firstName = 'firstname1';
        participant.lastName = 'lastname1';
        participant.email = 'firstname1.lastname1@email.com';
        participant.hearingRoleName = 'Interpreter';
        participant.interpreterFor = '';
        participant.id = '200';
        participant.linkedParticipants = linkedParticipants1;
        participants.push(participant);
        component.hearing.participants = participants;

        const participantList = component.participantsListComponent;
        participantList.removeParticipant(
            new VHParticipant({
                email: 'firstname.lastname@email.com',
                isExistPerson: false,
                interpretation_language: undefined
            })
        );
        participantList.selectedParticipant.emit();
        tick(600);
        expect(component.showConfirmRemoveInterpretee).toBe(true);
        participantList.removeParticipant(
            new VHParticipant({
                email: 'firstname1.lastname1@email.com',
                isExistPerson: false,
                interpretation_language: undefined
            })
        );
        participantList.selectedParticipant.emit();
        tick(600);
        expect(component.showConfirmationRemoveParticipant).toBe(true);
    }));
});
