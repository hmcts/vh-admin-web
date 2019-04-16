import { DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { CancelPopupComponent } from '../../popups/cancel-popup/cancel-popup.component';
import { SharedModule } from '../../shared/shared.module';
import { BreadcrumbStubComponent } from '../../testing/stubs/breadcrumb-stub';
import { DiscardConfirmPopupComponent } from '../../popups/discard-confirm-popup/discard-confirm-popup.component';

import { ReferenceDataService } from '../../services/reference-data.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { MockValues } from '../../testing/data/test-objects';
import { HearingScheduleComponent } from './hearing-schedule.component';
import { HearingModel } from '../../common/model/hearing.model';
import { ErrorService } from '../../services/error.service';

const newHearing = new HearingModel();

function initExistingHearingRequest(): HearingModel {
  const today = new Date();
  today.setHours(10, 30);

  const existingRequest = new HearingModel();
  existingRequest.hearing_type_id = 2;
  existingRequest.hearing_venue_id = 1,
  existingRequest.scheduled_date_time = today;
  existingRequest.scheduled_duration = 80;
  return existingRequest;
}

let dateControl: AbstractControl;
let startTimeHourControl: AbstractControl;
let startTimeMinuteControl: AbstractControl;
let durationHourControl: AbstractControl;
let durationMinuteControl: AbstractControl;
let courtControl: AbstractControl;

function initFormControls(component: HearingScheduleComponent) {
  dateControl = component.schedulingForm.controls['hearingDate'];
  startTimeHourControl = component.schedulingForm.controls['hearingStartTimeHour'];
  startTimeMinuteControl = component.schedulingForm.controls['hearingStartTimeMinute'];
  durationHourControl = component.schedulingForm.controls['hearingDurationHour'];
  durationMinuteControl = component.schedulingForm.controls['hearingDurationMinute'];
  courtControl = component.schedulingForm.controls['courtAddress'];
}

describe('HearingScheduleComponent first visit', () => {
  let component: HearingScheduleComponent;
  let fixture: ComponentFixture<HearingScheduleComponent>;

  let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
  let referenceDataServiceServiceSpy: jasmine.SpyObj<ReferenceDataService>;
  let routerSpy: jasmine.SpyObj<Router>;
  const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);

  beforeEach(async(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    referenceDataServiceServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService',
      ['getCourts']);
    referenceDataServiceServiceSpy.getCourts.and.returnValue(of(MockValues.Courts));
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
      ['getHearingMediums', 'getHearingTypes', 'getCurrentRequest',
        'updateHearingRequest', 'cancelRequest', 'onBookingChange']);

    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      providers: [
        { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ErrorService, useValue: errorService },
        DatePipe
      ],
      declarations: [HearingScheduleComponent, BreadcrumbStubComponent,
        CancelPopupComponent, DiscardConfirmPopupComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    initFormControls(component);
  });

  it('should create and initialize to blank form', () => {
    expect(component).toBeTruthy();
    expect(component.hearingDate.value).toBeNull();
    expect(component.hearingStartTimeHour.value).toBeNull();
    expect(component.hearingStartTimeMinute.value).toBeNull();
    expect(component.hearingDurationHour.value).toBeNull();
    expect(component.hearingDurationMinute.value).toBeNull();
    expect(component.courtAddress.value).toBe(-1);
  });

  it('should fail validation when form empty', () => {
    expect(component.schedulingForm.invalid).toBeTruthy();
  });

  it('should fail submission when form is invalid', () => {
    expect(component.failedSubmission).toBeFalsy();
    component.saveScheduleAndLocation();
    expect(component.failedSubmission).toBeTruthy();
    expect(component.hasSaved).toBeFalsy();
  });

  it('should validate hearing date', () => {
    expect(dateControl.valid).toBeFalsy();
    dateControl.setValue('9999-12-30');
    expect(dateControl.valid).toBeTruthy();
  });

  it('should validate hearing start time', () => {
    expect(startTimeHourControl.valid).toBeFalsy();
    expect(startTimeMinuteControl.valid).toBeFalsy();

    startTimeHourControl.setValue(-1);
    startTimeMinuteControl.setValue(-1);
    expect(startTimeHourControl.valid).toBeFalsy();
    expect(startTimeMinuteControl.valid).toBeFalsy();

    startTimeHourControl.setValue(26);
    startTimeMinuteControl.setValue(75);
    expect(startTimeHourControl.valid).toBeFalsy();
    expect(startTimeMinuteControl.valid).toBeFalsy();

    startTimeHourControl.setValue(10);
    startTimeMinuteControl.setValue(30);
    expect(startTimeHourControl.valid).toBeTruthy();
    expect(startTimeMinuteControl.valid).toBeTruthy();
  });

  it('should validate hearing duration', () => {
    expect(durationHourControl.valid).toBeFalsy();
    expect(durationMinuteControl.valid).toBeFalsy();

    durationHourControl.setValue(-1);
    durationMinuteControl.setValue(-1);
    expect(durationHourControl.invalid).toBeTruthy();
    expect(durationHourControl.invalid).toBeTruthy();

    durationHourControl.setValue(26);
    durationMinuteControl.setValue(75);
    expect(durationHourControl.invalid).toBeTruthy();
    expect(durationHourControl.invalid).toBeTruthy();

    durationHourControl.setValue(1);
    durationMinuteControl.setValue(30);
    expect(durationHourControl.valid).toBeTruthy();
    expect(durationHourControl.valid).toBeTruthy();
  });

  it('should validate court room', () => {
    expect(courtControl.valid).toBeFalsy();
    courtControl.setValue(1);
    expect(courtControl.valid).toBeTruthy();
  });

  it('should update hearing request when form is valid', () => {
    expect(component.schedulingForm.valid).toBeFalsy();

    dateControl.setValue('9999-12-30');
    startTimeHourControl.setValue(10);
    startTimeMinuteControl.setValue(30);
    durationHourControl.setValue(1);
    durationMinuteControl.setValue(30);
    courtControl.setValue(1);

    expect(component.schedulingForm.valid).toBeTruthy();

    component.saveScheduleAndLocation();

    expect(component.hasSaved).toBeTruthy();
  });
});

describe('HearingScheduleComponent returning to page', () => {
  let component: HearingScheduleComponent;
  let fixture: ComponentFixture<HearingScheduleComponent>;

  const existingRequest: HearingModel = initExistingHearingRequest();

  let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
  let referenceDataServiceServiceSpy: jasmine.SpyObj<ReferenceDataService>;
  let routerSpy: jasmine.SpyObj<Router>;
  const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);

  beforeEach(async(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    referenceDataServiceServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService',
      ['getCourts']);
    referenceDataServiceServiceSpy.getCourts.and.returnValue(of(MockValues.Courts));
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
      ['getHearingMediums', 'getHearingTypes', 'getCurrentRequest',
        'updateHearingRequest', 'cancelRequest', 'onBookingChange']);

    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);

    TestBed.configureTestingModule({
      imports: [HttpClientModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ErrorService, useValue: errorService },
        DatePipe
      ],
      declarations: [HearingScheduleComponent, BreadcrumbStubComponent,
        CancelPopupComponent, DiscardConfirmPopupComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    initFormControls(component);
  });

  it('should repopulate form', () => {
    const dateTransfomer = new DatePipe('en-GB');
    const dateString = dateTransfomer.transform(existingRequest.scheduled_date_time, 'yyyy-MM-dd');
    const durationDate = new Date(0, 0, 0, 0, 0, 0, 0);
    durationDate.setMinutes(existingRequest.scheduled_duration);

    const expectedStartHour = dateTransfomer.transform(existingRequest.scheduled_date_time, 'HH');
    const expectedStartMinute = dateTransfomer.transform(existingRequest.scheduled_date_time, 'mm');
    const expectedDurationHour = dateTransfomer.transform(durationDate, 'HH');
    const expectedDurationMinute = dateTransfomer.transform(durationDate, 'mm');

    expect(component.hearingDate.value).toBe(dateString);
    expect(component.hearingStartTimeHour.value).toBe(expectedStartHour);
    expect(component.hearingStartTimeMinute.value).toBe(expectedStartMinute);
    expect(component.hearingDurationHour.value).toBe(expectedDurationHour);
    expect(component.hearingDurationMinute.value).toBe(expectedDurationMinute);
    expect(component.courtAddress.value).toBe(existingRequest.hearing_venue_id);
  });
  it('should hide cancel and discard pop up confirmation', () => {
    component.attemptingCancellation = true;
    component.attemptingDiscardChanges = true;
    fixture.detectChanges();
    component.continueBooking();
    expect(component.attemptingCancellation).toBeFalsy();
    expect(component.attemptingDiscardChanges).toBeFalsy();
  });
  it('should show discard pop up confirmation', () => {
    component.editMode = true;
    component.schedulingForm.markAsDirty();
    fixture.detectChanges();
    component.confirmCancelBooking();
    expect(component.attemptingDiscardChanges).toBeTruthy();
  });
  it('should navigate to summary page if no changes', () => {
    component.editMode = true;
    component.schedulingForm.markAsPristine();
    fixture.detectChanges();
    component.confirmCancelBooking();
    expect(routerSpy.navigate).toHaveBeenCalled();
  });
  it('should show cancel booking confirmation pop up', () => {
    component.editMode = false;
    fixture.detectChanges();
    component.confirmCancelBooking();
    expect(component.attemptingCancellation).toBeTruthy();
  });
  it('should cancel booking, hide pop up and navigate to dashboard', () => {
    component.attemptingCancellation = true;

    fixture.detectChanges();
    component.cancelBooking();
    expect(component.attemptingCancellation).toBeFalsy();
    expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalled();
  });
  it('should cancel current changes, hide pop up and navigate to summary', () => {
    component.attemptingDiscardChanges = true;

    fixture.detectChanges();
    component.cancelChanges();
    expect(component.attemptingDiscardChanges).toBeFalsy();
    expect(routerSpy.navigate).toHaveBeenCalled();
  });
});
