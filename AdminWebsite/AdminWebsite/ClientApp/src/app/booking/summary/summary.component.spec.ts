import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { CancelPopupComponent } from 'src/app/popups/cancel-popup/cancel-popup.component';
import { SaveFailedPopupComponent } from 'src/app/popups/save-failed-popup/save-failed-popup.component';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';
import { LongDatetimePipe } from '../../../app/shared/directives/date-time.pipe';
import { CaseModel } from '../../common/model/case.model';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { RemovePopupComponent } from '../../popups/remove-popup/remove-popup.component';
import { WaitPopupComponent } from '../../popups/wait-popup/wait-popup.component';
import { BookingService } from '../../services/booking.service';
import { HearingDetailsResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { RecordingGuardService } from '../../services/recording-guard.service';
import { ReferenceDataService } from '../../services/reference-data.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { MockValues } from '../../testing/data/test-objects';
import { BookingEditStubComponent } from '../../testing/stubs/booking-edit-stub';
import { ParticipantsListStubComponent } from '../../testing/stubs/participant-list-stub';
import { SummaryComponent } from './summary.component';

function initExistingHearingRequest(): HearingModel {
    const pat1 = new ParticipantModel();
    pat1.email = 'aa@aa.aa';
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
    existingRequest.other_information = 'some notes';
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
let referenceDataServiceServiceSpy: jasmine.SpyObj<ReferenceDataService>;
let routerSpy: jasmine.SpyObj<Router>;
let loggerSpy: jasmine.SpyObj<Logger>;

routerSpy = jasmine.createSpyObj('Router', ['navigate', 'url']);
loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'info', 'warn', 'debug']);

referenceDataServiceServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService', ['getCourts']);
referenceDataServiceServiceSpy.getCourts.and.returnValue(of(MockValues.Courts));
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

describe('SummaryComponent with valid request', () => {
    let component: SummaryComponent;
    let fixture: ComponentFixture<SummaryComponent>;

    let existingRequest: any;

    beforeEach(
        waitForAsync(() => {
            existingRequest = initExistingHearingRequest();

            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
            videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
            videoHearingsServiceSpy.saveHearing.and.returnValue(of(new HearingDetailsResponse()));
            videoHearingsServiceSpy.cloneMultiHearings.and.callThrough();

            TestBed.configureTestingModule({
                providers: [
                    { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
                    { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                    { provide: Router, useValue: routerSpy },
                    { provide: Logger, useValue: loggerSpy }
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
                    LongDatetimePipe
                ],
                imports: [RouterTestingModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(SummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should get booking data from storage', () => {
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.hearing).toBeTruthy();
    });
    it('should display summary data from existing hearing', () => {
        expect(component.caseNumber).toEqual(existingRequest.cases[0].number);
        expect(component.caseName).toEqual(existingRequest.cases[0].name);
        expect(component.otherInformation).toEqual(existingRequest.other_information);
        const hearingstring = MockValues.HearingTypesList.find(c => c.id === existingRequest.hearing_type_id).name;
        expect(component.caseHearingType).toEqual(hearingstring);
        expect(component.hearingDate).toEqual(existingRequest.scheduled_date_time);
        const courtString = MockValues.Courts.find(c => c.id === existingRequest.hearing_venue_id);
        expect(component.courtRoomAddress).toEqual(`${courtString.name}, 123W`);
    });
    it('should remove participant', () => {
        component.ngOnInit();
        component.selectedParticipantEmail = 'aa@aa.aa';
        component.removeParticipant();
        fixture.detectChanges();
        expect(component.hearing.participants.length).toBe(0);
        expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
    });
    it('should not remove participant by not existing email', () => {
        component.ngOnInit();
        const pat1 = new ParticipantModel();
        pat1.email = 'aa@aa.aa';
        component.hearing.participants = [];
        component.hearing.participants.push(pat1);
        component.selectedParticipantEmail = 'bb@bb.bb';

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
    it('should save new booking', async () => {
        component.ngOnInit();
        fixture.detectChanges();
        await component.bookHearing();
        expect(component.bookingsSaving).toBeTruthy();
        expect(component.showWaitSaving).toBeFalsy();
        expect(routerSpy.navigate).toHaveBeenCalled();
        expect(videoHearingsServiceSpy.saveHearing).toHaveBeenCalled();
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
    it('should save new booking with multi hearings', async () => {
        component.ngOnInit();
        component.hearing.multiDays = true;
        component.hearing.end_hearing_date_time = new Date(component.hearing.scheduled_date_time);
        component.hearing.end_hearing_date_time.setDate(component.hearing.end_hearing_date_time.getDate() + 5);
        fixture.detectChanges();

        await component.bookHearing();
        expect(component.bookingsSaving).toBeTruthy();
        expect(component.showWaitSaving).toBeFalsy();
        expect(routerSpy.navigate).toHaveBeenCalled();
        expect(videoHearingsServiceSpy.saveHearing).toHaveBeenCalled();
        expect(videoHearingsServiceSpy.cloneMultiHearings).toHaveBeenCalled();
    });
});

describe('SummaryComponent  with invalid request', () => {
    let component: SummaryComponent;
    let fixture: ComponentFixture<SummaryComponent>;

    beforeEach(
        waitForAsync(() => {
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
            videoHearingsServiceSpy.saveHearing.and.throwError('Fake error');

            TestBed.configureTestingModule({
                providers: [
                    { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
                    { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                    { provide: Router, useValue: routerSpy },
                    { provide: Logger, useValue: loggerSpy }
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
                    LongDatetimePipe
                ]
            }).compileComponents();
        })
    );

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

    beforeEach(
        waitForAsync(() => {
            const existingRequest = initExistingHearingRequest();
            existingRequest.hearing_id = '12345ty';
            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
            videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
            videoHearingsServiceSpy.updateHearing.and.returnValue(of(new HearingDetailsResponse()));

            TestBed.configureTestingModule({
                providers: [
                    { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
                    { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                    { provide: Router, useValue: routerSpy },
                    { provide: Logger, useValue: loggerSpy }
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
                    LongDatetimePipe
                ]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(SummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
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
        expect(component.caseHearingType).toBe('Application to Set Aside Judgement (SAJ)');
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

        expect(videoHearingsServiceSpy.updateHearing).toHaveBeenCalled();
    });
    it('should remove existing participant', () => {
        component.hearing = initExistingHearingRequest();
        component.hearing.hearing_id = '12345';
        component.hearing.participants[0].id = '678';
        component.selectedParticipantEmail = 'aa@aa.aa';
        component.removeParticipant();
        fixture.detectChanges();
        expect(loggerSpy.info).toHaveBeenCalled();
    });
    it('should unsubscribe subcription on destroy', () => {
        component.ngOnDestroy();
        component.$subscriptions.forEach(s => expect(s.closed).toBe(true));
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
        const result = component.getParticipantInfo('123123-123');
        expect(result).toBe('solicitor 01, representing citizen 01');
    });
    it('it should display the participant and representee', () => {
        component.hearing = initExistingHearingRequest();
        const result = component.getParticipantInfo('123123-1231');
        expect(result).toBe('');
    });
});

describe('SummaryComponent  with multi days request', () => {
    let component: SummaryComponent;
    let existingRequest: HearingModel;
    let bookingServiceSpy: jasmine.SpyObj<BookingService>;
    let recordingGuardServiceSpy: jasmine.SpyObj<RecordingGuardService>;

    bookingServiceSpy = jasmine.createSpyObj<BookingService>('BookingService', ['removeParticipantEmail']);
    recordingGuardServiceSpy = jasmine.createSpyObj<RecordingGuardService>('RecordingGuardService', ['switchOffRecording']);
    existingRequest = initExistingHearingRequest();
    existingRequest.multiDays = true;
    existingRequest.hearing_id = '12345ty';
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
    videoHearingsServiceSpy.updateHearing.and.returnValue(of(new HearingDetailsResponse()));

    component = new SummaryComponent(
        videoHearingsServiceSpy,
        routerSpy,
        referenceDataServiceServiceSpy,
        bookingServiceSpy,
        loggerSpy,
        recordingGuardServiceSpy
    );

    it('should display summary data from existing hearing with multi days', () => {
        component.hearing = existingRequest;
        component.hearing.end_hearing_date_time = new Date(component.hearing.scheduled_date_time);
        component.hearing.end_hearing_date_time.setDate(component.hearing.end_hearing_date_time.getDate() + 5);

        component.ngOnInit();

        expect(new Date(component.hearingDate).getDay()).toEqual(new Date(existingRequest.scheduled_date_time).getDay());
        expect(new Date(component.endHearingDate).getDay()).toEqual(new Date(existingRequest.end_hearing_date_time).getDay());

        expect(new Date(component.hearingDate).getMonth()).toEqual(new Date(existingRequest.scheduled_date_time).getMonth());
        expect(new Date(component.endHearingDate).getMonth()).toEqual(new Date(existingRequest.end_hearing_date_time).getMonth());

        expect(new Date(component.hearingDate).getFullYear()).toEqual(new Date(existingRequest.scheduled_date_time).getFullYear());
        expect(new Date(component.endHearingDate).getFullYear()).toEqual(new Date(existingRequest.end_hearing_date_time).getFullYear());
    });
});
