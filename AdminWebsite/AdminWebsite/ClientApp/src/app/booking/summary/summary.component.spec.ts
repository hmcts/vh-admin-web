import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CancelPopupComponent } from 'src/app/popups/cancel-popup/cancel-popup.component';
import { RemovePopupComponent } from '../../popups/remove-popup/remove-popup.component';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';
import { BookingEditStubComponent } from '../../testing/stubs/booking-edit-stub';
import { ReferenceDataService } from '../../services/reference-data.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { MockValues } from '../../testing/data/test-objects';
import { SummaryComponent } from './summary.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HearingModel } from '../../common/model/hearing.model';
import { CaseModel } from '../../common/model/case.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { ParticipantsListStubComponent } from '../../testing/stubs/participant-list-stub';
import { WaitPopupComponent } from '../../popups/wait-popup/wait-popup.component';
import { SaveFailedPopupComponent } from 'src/app/popups/save-failed-popup/save-failed-popup.component';
import { HearingDetailsResponse } from '../../services/clients/api-client';
import { LongDatetimePipe } from '../../../app/shared/directives/date-time.pipe';

function initExistingHearingRequest(): HearingModel {

  const pat1 = new ParticipantModel();
  pat1.email = 'aa@aa.aa';

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
  existingRequest.court_room = '123W';
  const hearingTypeName = MockValues.HearingTypesList.find(c => c.id === existingRequest.hearing_type_id).name;
  existingRequest.hearing_type_name = hearingTypeName;
  const courtString = MockValues.Courts.find(c => c.id === existingRequest.hearing_venue_id).name;
  existingRequest.court_name = courtString;

  existingRequest.participants = [];
  existingRequest.participants.push(pat1);
  return existingRequest;
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

routerSpy = jasmine.createSpyObj('Router', ['navigate', 'url']);

referenceDataServiceServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService',
  ['getCourts']);
referenceDataServiceServiceSpy.getCourts.and.returnValue(of(MockValues.Courts));
videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
  ['getHearingMediums', 'getHearingTypes', 'getCurrentRequest',
    'updateHearingRequest', 'saveHearing', 'cancelRequest', 'updateHearing', 'setBookingHasChanged']);


describe('SummaryComponent with valid request', () => {
  let component: SummaryComponent;
  let fixture: ComponentFixture<SummaryComponent>;

  let existingRequest: any;

  beforeEach(async(() => {
    existingRequest = initExistingHearingRequest();

    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
    videoHearingsServiceSpy.saveHearing.and.returnValue(of(new HearingDetailsResponse()));

    TestBed.configureTestingModule({
      providers: [
        { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: routerSpy }
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
      imports: [RouterTestingModule],
    })
      .compileComponents();
  }));

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
  it('should save new booking', () => {
    component.ngOnInit();
    fixture.detectChanges();

    component.bookHearing();
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
});

describe('SummaryComponent  with invalid request', () => {
  let component: SummaryComponent;
  let fixture: ComponentFixture<SummaryComponent>;

  beforeEach(async(() => {
    initExistingHearingRequest();
    const existingRequest = initBadHearingRequest();
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
    videoHearingsServiceSpy.saveHearing.and.callFake(() => {
      return throwError(new Error('Fake error'));
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: routerSpy }
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
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display save failed message', () => {
    component.bookHearing();
    expect(component.showErrorSaving).toBeTruthy();
    expect(component.showWaitSaving).toBeFalsy();
  });
});

describe('SummaryComponent  with existing request', () => {
  let component: SummaryComponent;
  let fixture: ComponentFixture<SummaryComponent>;

  beforeEach(async(() => {
    const existingRequest = initExistingHearingRequest();
    existingRequest.hearing_id = '12345ty';
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
    videoHearingsServiceSpy.updateHearing.and.returnValue(of(new HearingDetailsResponse()));

    TestBed.configureTestingModule({
      providers: [
        { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: routerSpy }
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
    })
      .compileComponents();
  }));

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

});

