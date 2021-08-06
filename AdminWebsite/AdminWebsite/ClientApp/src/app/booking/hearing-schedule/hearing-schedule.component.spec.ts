import { DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AbstractControl, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { HearingVenueResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logger';
import { HearingModel } from '../../common/model/hearing.model';
import { CancelPopupComponent } from '../../popups/cancel-popup/cancel-popup.component';
import { DiscardConfirmPopupComponent } from '../../popups/discard-confirm-popup/discard-confirm-popup.component';
import { ErrorService } from '../../services/error.service';
import { ReferenceDataService } from '../../services/reference-data.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { SharedModule } from '../../shared/shared.module';
import { MockValues } from '../../testing/data/test-objects';
import { BreadcrumbStubComponent } from '../../testing/stubs/breadcrumb-stub';
import { HearingScheduleComponent } from './hearing-schedule.component';

const newHearing = new HearingModel();

function initExistingHearingRequest(): HearingModel {
    const today = new Date();
    today.setHours(10, 30);

    const existingRequest = new HearingModel();
    existingRequest.hearing_type_id = 2;
    (existingRequest.hearing_venue_id = 1), (existingRequest.scheduled_date_time = today);
    existingRequest.scheduled_duration = 80;
    existingRequest.multiDays = false;
    return existingRequest;
}

let dateControl: AbstractControl;
let startTimeHourControl: AbstractControl;
let startTimeMinuteControl: AbstractControl;
let durationHourControl: AbstractControl;
let durationMinuteControl: AbstractControl;
let courtControl: AbstractControl;
let multiDaysControl: AbstractControl;
let endDateControl: AbstractControl;

function initFormControls(component: HearingScheduleComponent) {
    dateControl = component.form.controls['hearingDate'];
    startTimeHourControl = component.form.controls['hearingStartTimeHour'];
    startTimeMinuteControl = component.form.controls['hearingStartTimeMinute'];
    durationHourControl = component.form.controls['hearingDurationHour'];
    durationMinuteControl = component.form.controls['hearingDurationMinute'];
    courtControl = component.form.controls['courtAddress'];
    multiDaysControl = component.form.controls['multiDays'];
    endDateControl = component.form.controls['endHearingDate'];
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn', 'info']);

describe('HearingScheduleComponent first visit', () => {
    let component: HearingScheduleComponent;
    let fixture: ComponentFixture<HearingScheduleComponent>;

    let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
    let referenceDataServiceServiceSpy: jasmine.SpyObj<ReferenceDataService>;
    let routerSpy: jasmine.SpyObj<Router>;
    const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);

    beforeEach(
        waitForAsync(() => {
            routerSpy = jasmine.createSpyObj('Router', ['navigate']);

            referenceDataServiceServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService', [
                'getCourts',
                'getPublicHolidays'
            ]);
            referenceDataServiceServiceSpy.getCourts.and.returnValue(of(MockValues.Courts));
            referenceDataServiceServiceSpy.getPublicHolidays.and.returnValue([]);
            videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
                'getHearingTypes',
                'getCurrentRequest',
                'updateHearingRequest',
                'cancelRequest',
                'setBookingHasChanged'
            ]);

            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);

            TestBed.configureTestingModule({
                imports: [SharedModule, RouterTestingModule],
                providers: [
                    { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
                    { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                    { provide: Router, useValue: routerSpy },
                    { provide: ErrorService, useValue: errorService },
                    DatePipe,
                    { provide: Logger, useValue: loggerSpy }
                ],
                declarations: [HearingScheduleComponent, BreadcrumbStubComponent, CancelPopupComponent, DiscardConfirmPopupComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(HearingScheduleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        initFormControls(component);
    });

    it('should create and initialize to blank form', () => {
        expect(component).toBeTruthy();
        expect(component.hearingDateControl.value).toBeNull();
        expect(component.hearingStartTimeHourControl.value).toBeNull();
        expect(component.hearingStartTimeMinuteControl.value).toBeNull();
        expect(component.hearingDurationHourControl.value).toBeNull();
        expect(component.hearingDurationMinuteControl.value).toBeNull();
        expect(component.courtAddressControl.value).toBe(-1);
        expect(component.multiDaysHearing).toBeFalsy();
    });
    it('should set controls for duration', () => {
        component.ngOnInit();
        expect(component.durationHourControl).toBeTruthy();
        expect(component.durationMinuteControl).toBeTruthy();
    });

    it('should fail validation when form empty', () => {
        expect(component.form.invalid).toBeTruthy();
    });

    it('should fail submission when form is invalid', () => {
        expect(component.failedSubmission).toBeFalsy();
        component.save();
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

    it('should set invalid hearing start hours time if hours are in the past', () => {
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        let todayHours = new Date().getHours() - 1;

        if (todayHours < 0) {
            // if current hour then its valid depend on minutes
            todayHours = new Date().getHours();
            dateControl.setValue(todayDate);
            startTimeHourControl.setValue(todayHours);
            startTimeHourControl.markAsTouched();
            component.startHoursInPast();
            expect(component.isStartHoursInPast).toBeFalsy();
        } else {
            dateControl.setValue(todayDate);
            startTimeHourControl.setValue(todayHours);
            startTimeHourControl.markAsTouched();
            component.startHoursInPast();
            expect(component.isStartHoursInPast).toBeTruthy();
        }
    });
    it('should set invalid hearing start minutes time if it is in the past', () => {
        expect(startTimeHourControl.valid).toBeFalsy();
        expect(startTimeMinuteControl.valid).toBeFalsy();
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        const todayHours = new Date().getHours();
        const todayMinutes = new Date().getMinutes();

        dateControl.setValue(todayDate);
        startTimeHourControl.setValue(todayHours);
        startTimeMinuteControl.setValue(todayMinutes);
        startTimeMinuteControl.markAsTouched();
        component.startMinutesInPast();
        expect(component.isStartMinutesInPast).toBeTruthy();
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

    it('should validate court room and return invalid as value has invalid spec characters', () => {
        component.form.controls['courtRoom'].setValue('%');
        component.failedSubmission = true;
        expect(component.courtRoomInvalid).toBe(true);
    });

    it('court room field validity pattern', () => {
        let errors = {};
        component.form.controls['courtRoom'].setValue('%');
        const court_room = component.form.controls['courtRoom'];
        errors = court_room.errors || {};
        expect(errors['pattern']).toBeTruthy();
    });

    it('should update hearing request when form is valid', () => {
        expect(component.form.valid).toBeFalsy();
        multiDaysControl.setValue(false);
        dateControl.setValue('9999-12-30');
        endDateControl.setValue('0001-01-01');
        startTimeHourControl.setValue(10);
        startTimeMinuteControl.setValue(30);
        durationHourControl.setValue(1);
        durationMinuteControl.setValue(30);
        courtControl.setValue(1);
        multiDaysControl.setValue(false);
        component.isStartHoursInPast = false;
        component.isStartMinutesInPast = false;

        expect(component.form.valid).toBeTruthy();

        component.save();

        expect(component.hasSaved).toBeTruthy();
    });
    it('should not update hearing request and move next page when hearing start tieme is not valid', () => {
        dateControl.setValue('9999-12-30');
        endDateControl.setValue('99999-12-31');
        startTimeHourControl.setValue(10);
        startTimeMinuteControl.setValue(30);
        durationHourControl.setValue(1);
        durationMinuteControl.setValue(30);
        courtControl.setValue(1);
        component.isStartHoursInPast = true;
        component.isStartMinutesInPast = true;
        component.hasSaved = false;
        multiDaysControl.setValue(false);

        expect(component.form.valid).toBeTruthy();
        component.save();

        expect(component.failedSubmission).toBeTruthy();
        expect(component.hasSaved).toBeFalsy();
    });
    it('should on start date change reset to false flag indicated the time was in the past', () => {
        component.isStartMinutesInPast = true;
        component.isStartHoursInPast = true;

        component.resetPastTimeOnBlur();
        expect(component.isStartHoursInPast).toBeFalsy();
        expect(component.isStartMinutesInPast).toBeFalsy();
    });
    it('should indicate that hearing time is in the past before saving', () => {
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        const todayHours = new Date().getHours();
        const todayMinutes = new Date().getMinutes();
        dateControl.setValue(todayDate);
        startTimeHourControl.setValue(todayHours);
        startTimeMinuteControl.setValue(todayMinutes);
        const result = component.finalCheckStartDateTimeInPast();
        expect(result).toBeFalsy();
        expect(component.isStartMinutesInPast).toBeTruthy();
        expect(component.isStartHoursInPast).toBeTruthy();
    });
    it('should indicate that hearing time is valid before saving', () => {
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        todayDate.setDate(todayDate.getDate() + 1);
        const todayHours = new Date().getHours();
        const todayMinutes = new Date().getMinutes();
        dateControl.setValue(todayDate);
        startTimeHourControl.setValue(todayHours);
        startTimeMinuteControl.setValue(todayMinutes);
        const result = component.finalCheckStartDateTimeInPast();
        expect(result).toBeTruthy();
        expect(component.isStartMinutesInPast).toBeFalsy();
        expect(component.isStartHoursInPast).toBeFalsy();
    });

    it('should set-up the hearing date control', () => {
        component.addHearingDate();
        expect(component.hearingDateControl).not.toBe(null);
    });

    it('should return invalid for hearing date in the past', () => {
        component.addHearingDate();
        component.addHearingDateControl.setValue('2021-03-01');
        expect(component.isAddHearingControlValid()).toBe(false);
    });

    it('should return invalid for hearing date on a weekend', () => {
        component.addHearingDate();
        component.addHearingDateControl.setValue('2021-03-06');
        expect(component.isAddHearingControlValid()).toBe(false);
    });

    it('should return true if a date is already selected', () => {
        component.hearingDates = [new Date()];
        component.addHearingDate();
        component.addHearingDateControl.setValue(new Date());
        expect(component.isDateAlreadySelected()).toBe(true);
    });

    it('should add a new hearing date', () => {
        const hearingDates = component.hearingDates.length;
        component.addValidHearingDate('2020-01-01');
        expect(component.hearingDates.length).toBe(hearingDates + 1);
    });

    it('should nullify hearing date control once date is added', () => {
        component.addValidHearingDate('2020-01-01');
        expect(component.addHearingDateControl).toBe(null);
    });

    it('should add a valid hearing date', () => {
        spyOn(component, 'addValidHearingDate');
        component.addHearingDate();
        const value = new Date();
        component.addHearingDateControl.setValue(value);
        component.hearingDateChanged({ target: { value } });
        expect(component.addValidHearingDate).toHaveBeenCalled();
    });

    it('should remove hearing date', () => {
        component.hearingDates = [new Date()];
        component.removeHearingDate(0);
        expect(component.hearingDates.length).toBe(0);
    });

    it('should save individual day hearing', () => {
        spyOn(component, 'saveMultiIndividualDayHearing');
        component.multiDaysControl.setValue(true);
        component.multiDaysRangeControl.setValue(false);
        component.hearingDates = [new Date()];
        component.save();
        expect(component.saveMultiIndividualDayHearing).toHaveBeenCalled();
    });

    it('should update multi day individual hearing request when form is valid', () => {
        component.multiDaysControl.setValue(true);
        component.multiDaysRangeControl.setValue(false);
        dateControl.setValue('9999-12-30');
        endDateControl.setValue('0001-01-01');
        startTimeHourControl.setValue(10);
        startTimeMinuteControl.setValue(30);
        durationHourControl.setValue(1);
        durationMinuteControl.setValue(30);
        courtControl.setValue(1);
        multiDaysControl.setValue(true);
        component.isStartHoursInPast = false;
        component.isStartMinutesInPast = false;
        component.hearingDates = [new Date()];
        expect(component.form.valid).toBeTruthy();
        component.save();
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

    beforeEach(
        waitForAsync(() => {
            routerSpy = jasmine.createSpyObj('Router', ['navigate']);

            referenceDataServiceServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService', [
                'getCourts',
                'getPublicHolidays'
            ]);
            referenceDataServiceServiceSpy.getCourts.and.returnValue(of(MockValues.Courts));
            referenceDataServiceServiceSpy.getPublicHolidays.and.returnValue([]);
            videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
                'getHearingTypes',
                'getCurrentRequest',
                'updateHearingRequest',
                'cancelRequest',
                'setBookingHasChanged'
            ]);

            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);

            TestBed.configureTestingModule({
                imports: [HttpClientModule, ReactiveFormsModule, RouterTestingModule],
                providers: [
                    { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
                    { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                    { provide: Router, useValue: routerSpy },
                    { provide: ErrorService, useValue: errorService },
                    DatePipe,
                    { provide: Logger, useValue: loggerSpy }
                ],
                declarations: [HearingScheduleComponent, BreadcrumbStubComponent, CancelPopupComponent, DiscardConfirmPopupComponent]
            }).compileComponents();
        })
    );

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

        expect(component.hearingDateControl.value).toBe(dateString);
        expect(component.hearingStartTimeHourControl.value).toBe(expectedStartHour);
        expect(component.hearingStartTimeMinuteControl.value).toBe(expectedStartMinute);
        expect(component.hearingDurationHourControl.value).toBe(expectedDurationHour);
        expect(component.hearingDurationMinuteControl.value).toBe(expectedDurationMinute);
        expect(component.courtAddressControl.value).toBe(existingRequest.hearing_venue_id);
        expect(component.multiDaysHearing).toBe(existingRequest.multiDays);
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
        component.form.markAsDirty();
        fixture.detectChanges();
        component.confirmCancelBooking();
        expect(component.attemptingDiscardChanges).toBeTruthy();
    });
    it('should navigate to summary page if no changes', () => {
        component.editMode = true;
        component.form.markAsPristine();
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
    it('should set venue for existing hearing', () => {
        component.availableCourts = [
            new HearingVenueResponse({ id: 1, name: 'aa@hmcts.net' }),
            new HearingVenueResponse({ id: 2, name: 'aa@hmcts.net1' })
        ];
        component.hearing = new HearingModel();
        component.hearing.court_name = 'aa@hmcts.net1';
        component.isExistinHearing = true;
        component.setVenueForExistingHearing();

        expect(component.selectedCourtName).toBe('aa@hmcts.net1');
    });

    it('should sanitize text for court room', () => {
        component.courtRoomControl.setValue('<script>text</script>');
        component.courtRoomOnBlur();
        fixture.detectChanges();
        expect(component.courtRoomControl.value).toBe('text');
    });

    it('should unsibscribe subcription on destroy', () => {
        component.ngOnDestroy();
    });
});

describe('HearingScheduleComponent multi days hearing', () => {
    let component: HearingScheduleComponent;
    let fixture: ComponentFixture<HearingScheduleComponent>;

    const existingRequest: HearingModel = initExistingHearingRequest();

    let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
    let referenceDataServiceServiceSpy: jasmine.SpyObj<ReferenceDataService>;
    let routerSpy: jasmine.SpyObj<Router>;
    const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);

    beforeEach(
        waitForAsync(() => {
            routerSpy = jasmine.createSpyObj('Router', ['navigate']);

            referenceDataServiceServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService', [
                'getCourts',
                'getPublicHolidays'
            ]);
            referenceDataServiceServiceSpy.getCourts.and.returnValue(of(MockValues.Courts));
            referenceDataServiceServiceSpy.getPublicHolidays.and.returnValue([]);
            videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
                'getHearingTypes',
                'getCurrentRequest',
                'updateHearingRequest',
                'cancelRequest',
                'setBookingHasChanged'
            ]);

            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);

            TestBed.configureTestingModule({
                imports: [HttpClientModule, ReactiveFormsModule, RouterTestingModule],
                providers: [
                    { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
                    { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                    { provide: Router, useValue: routerSpy },
                    { provide: ErrorService, useValue: errorService },
                    DatePipe,
                    { provide: Logger, useValue: loggerSpy }
                ],
                declarations: [HearingScheduleComponent, BreadcrumbStubComponent, CancelPopupComponent, DiscardConfirmPopupComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(HearingScheduleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        initFormControls(component);
    });
    it('should set controls for duration', () => {
        component.hearing = existingRequest;
        component.ngOnInit();
        expect(component.durationHourControl).toBeTruthy();
        expect(component.durationMinuteControl).toBeTruthy();
    });

    it('should set multi days flag to true', () => {
        component.hearing = existingRequest;
        component.multiDaysControl.setValue(true);
        expect(component.multiDaysHearing).toBe(true);
    });
    it('should populate hearing dates', () => {
        component.hearing.hearing_dates = [new Date(), new Date(), new Date()];
        component.ngOnInit();
        expect(component.hearingDates.length).toBe(3);
    });
    it('should validate end date to true', () => {
        const startDateValue = new Date(addDays(Date.now(), 1));
        const endDateValue = new Date(addDays(Date.now(), 3));
        component.multiDaysControl.setValue(true);
        dateControl.setValue(startDateValue);
        component.endHearingDateControl.markAsTouched();
        endDateControl.setValue(endDateValue);
        expect(component.endHearingDateInvalid).toBeFalsy();
    });
    it('should validate end date to false if it is matched the start day', () => {
        const startDateValue = new Date(addDays(Date.now(), 1));
        const endDateValue = new Date(addDays(Date.now(), 1));
        component.multiDaysControl.setValue(true);
        dateControl.setValue(startDateValue);
        component.endHearingDateControl.markAsTouched();

        endDateControl.setValue(endDateValue);
        expect(component.endHearingDateInvalid).toBeTruthy();
    });
    it('should validate end date to false if it is less than start day', () => {
        const startDateValue = new Date(addDays(Date.now(), 1));
        const endDateValue = new Date(Date.now());

        component.multiDaysControl.setValue(true);
        dateControl.setValue(startDateValue);
        component.endHearingDateControl.markAsTouched();

        endDateControl.setValue(endDateValue);
        expect(component.endHearingDateInvalid).toBeTruthy();
    });
    it('should repopulate form', () => {
        const endDateValue = new Date(addDays(Date.now(), 3));

        const dateTransfomer = new DatePipe('en-GB');
        const dateString = dateTransfomer.transform(existingRequest.scheduled_date_time, 'yyyy-MM-dd');
        const endDateString = dateTransfomer.transform(existingRequest.end_hearing_date_time, 'yyyy-MM-dd');

        existingRequest.end_hearing_date_time = endDateValue;

        const expectedStartHour = dateTransfomer.transform(existingRequest.scheduled_date_time, 'HH');
        const expectedStartMinute = dateTransfomer.transform(existingRequest.scheduled_date_time, 'mm');
        component.multiDaysControl.setValue(true);

        expect(component.hearingDateControl.value).toBe(dateString);
        expect(component.hearingStartTimeHourControl.value).toBe(expectedStartHour);
        expect(component.hearingStartTimeMinuteControl.value).toBe(expectedStartMinute);
        expect(component.courtAddressControl.value).toBe(existingRequest.hearing_venue_id);
        expect(component.multiDaysHearing).toBe(true);
        expect(component.endHearingDateControl.value).toBe(endDateString);
    });
    it('should duration set to untoched if multi days hearing', () => {
        component.multiDaysControl.setValue(true);
        expect(component.hearingDurationHourControl.touched).toBe(false);
        expect(component.hearingDurationMinuteControl.touched).toBe(false);
    });
    it('should set end date to null if multi days hearing is off', () => {
        component.multiDaysControl.setValue(false);
        expect(component.endHearingDateControl.value).toBe(null);
    });
    it('should hide multi days checkbox if the hearing is booked', () => {
        component.hearing.hearing_id = '123455555900';
        component.ngOnInit();
        expect(component.isBookedHearing).toBe(true);
    });
    it('should display multi days checkbox if the hearing is not booked', () => {
        component.hearing.hearing_id = null;
        component.ngOnInit();
        expect(component.isBookedHearing).toBe(false);
    });
});
