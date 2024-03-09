import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Constants } from 'src/app/common/constants';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logger';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SanitizeInputText } from '../../common/formatters/sanitize-input-text';
import { HearingModel } from '../../common/model/hearing.model';
import { BookingService } from '../../services/booking.service';
import { HearingVenueResponse } from '../../services/clients/api-client';
import { ReferenceDataService } from '../../services/reference-data.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';
import { pastDateValidator } from '../../common';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { Subject, takeUntil } from 'rxjs';
import { uniqueDateValidator } from 'src/app/common/custom-validations/unique-date-validator';

@Component({
    selector: 'app-hearing-schedule',
    templateUrl: './hearing-schedule.component.html',
    styleUrls: ['./hearing-schedule.component.scss']
})
export class HearingScheduleComponent extends BookingBaseComponent implements OnInit, OnDestroy {
    hearing: HearingModel;
    availableCourts: HearingVenueResponse[];
    failedSubmission: boolean;
    attemptingCancellation = false;
    attemptingDiscardChanges = false;
    hasSaved = false;
    today = new Date();
    canNavigate = true;
    selectedCourtName: string;
    selectedCourtCode: string;
    isExistinHearing: boolean;
    endDateEarlierThanStartDate: boolean;
    isStartHoursInPast = false;
    isStartMinutesInPast = false;
    multiDaysHearing = false;
    durationHourControl: FormControl;
    durationMinuteControl: FormControl;
    isBookedHearing = false;
    addHearingDateControl: FormControl = null;
    hearingDates: Date[] = [];
    hearingIds: string[] = [];
    datesFormArray: FormArray;
    hearingsInGroupToEdit: HearingModel[];

    private destroyed$ = new Subject<void>();
    private addJudciaryMembersFeatureEnabled: boolean;
    multiDayBookingEnhancementsEnabled: boolean;

    constructor(
        private refDataService: ReferenceDataService,
        protected hearingService: VideoHearingsService,
        private formBuilder: FormBuilder,
        protected router: Router,
        private datePipe: DatePipe,
        protected bookingService: BookingService,
        private errorService: ErrorService,
        protected logger: Logger,
        private ldService: LaunchDarklyService
    ) {
        super(bookingService, router, hearingService, logger);
    }

    ngOnInit() {
        this.ldService
            .getFlag<boolean>(FeatureFlags.useV2Api)
            .pipe(takeUntil(this.destroyed$))
            .subscribe(result => {
                this.addJudciaryMembersFeatureEnabled = result;
            });
        this.ldService
            .getFlag<boolean>(FeatureFlags.multiDayBookingEnhancements)
            .pipe(takeUntil(this.destroyed$))
            .subscribe(enabled => {
                this.multiDayBookingEnhancementsEnabled = enabled;
            });
        this.failedSubmission = false;
        this.checkForExistingRequest();
        this.retrieveCourts();
        this.initForm();
        super.ngOnInit();
    }

    private checkForExistingRequest() {
        this.hearing = this.hearingService.getCurrentRequest();
        this.isExistinHearing = !!this.hearing.hearing_id;
        this.isBookedHearing = this.hearing?.hearing_id?.length > 0;
        this.logger.debug(`${this.loggerPrefix} Checking for existing hearing`, {
            hearingExists: this.isExistinHearing,
            isBookedHearing: this.isBookedHearing,
            hearing: this.hearing?.hearing_id
        });
    }

    private initForm() {
        let hearingDateParsed = null;
        let startTimeHour = null;
        let startTimeMinute = null;
        let durationHour = null;
        let durationMinute = null;
        let room = '';
        this.multiDaysHearing = null;
        let endHearingDateParsed = null;

        let multiDaysRange = true;

        if (this.hearing) {
            this.logger.debug(`${this.loggerPrefix} Populating form with existing hearing details`, {
                hearing: this.hearing?.hearing_id
            });
            if (this.hearing.hearing_venue_id === undefined) {
                this.hearing.hearing_venue_id = -1;
            }

            if (this.hearing.scheduled_date_time) {
                const date = new Date(this.hearing.scheduled_date_time);
                hearingDateParsed = this.datePipe.transform(date, 'yyyy-MM-dd');
                startTimeHour = (date.getHours() < 10 ? '0' : '') + date.getHours();
                startTimeMinute = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
            }

            if (this.hearing.end_hearing_date_time) {
                const date = new Date(this.hearing.end_hearing_date_time);
                endHearingDateParsed = this.datePipe.transform(date, 'yyyy-MM-dd');
            }

            if (this.hearing.hearing_dates.length > 0) {
                this.hearingDates = this.hearing.hearing_dates.map(x => new Date(x));
                multiDaysRange = false;
            }

            if (this.hearing.scheduled_duration) {
                const duration = new Date();
                duration.setHours(0, 0, 0, 0);
                duration.setMinutes(this.hearing.scheduled_duration);
                durationHour = (duration.getHours() < 10 ? '0' : '') + duration.getHours();
                durationMinute = (duration.getMinutes() < 10 ? '0' : '') + duration.getMinutes();
            }

            if (this.hearing.scheduled_date_time && this.hearing.scheduled_duration && this.hearing.hearing_venue_id) {
                this.hasSaved = true;
            }

            if (this.hearing.court_room) {
                room = this.hearing.court_room;
            }

            this.multiDaysHearing = this.hearing.isMultiDayEdit;

            if (this.hearing.isMultiDayEdit && this.hearing.multiDayHearingLastDayScheduledDateTime) {
                const date = new Date(this.hearing.multiDayHearingLastDayScheduledDateTime);
                endHearingDateParsed = this.datePipe.transform(date, 'yyyy-MM-dd');
            }
        }

        if (!this.showDurationControls) {
            this.durationHourControl = new FormControl(durationHour);
            this.durationMinuteControl = new FormControl(durationMinute);
        } else {
            this.durationHourControl = new FormControl(durationHour, [Validators.required, Validators.min(0), Validators.max(23)]);
            this.durationMinuteControl = new FormControl(durationMinute, [Validators.required, Validators.min(0), Validators.max(59)]);
        }

        this.selectedCourtName = this.hearing.court_name;
        this.selectedCourtCode = this.hearing.court_code;

        this.datesFormArray = this.formBuilder.array([]);

        this.form = this.formBuilder.group({
            hearingDate: [hearingDateParsed, [Validators.required, pastDateValidator()]],
            hearingStartTimeHour: [startTimeHour, [Validators.required, Validators.min(0), Validators.max(23)]],
            hearingStartTimeMinute: [startTimeMinute, [Validators.required, Validators.min(0), Validators.max(59)]],
            hearingDurationHour: this.durationHourControl,
            hearingDurationMinute: this.durationMinuteControl,
            courtAddress: [this.hearing.hearing_venue_id, [Validators.required, Validators.min(1)]],
            courtRoom: [room, [Validators.pattern(Constants.TextInputPatternDisplayName), Validators.maxLength(255)]],
            multiDays: [this.multiDaysHearing],
            endHearingDate: [endHearingDateParsed],
            multiDaysRange: [multiDaysRange],
            dates: this.datesFormArray
        });

        if (this.hearing && this.hearing.hearingsInGroup && this.hearing.hearingsInGroup.length > 1) {
            this.setUpDateControls();
        }

        ['multiDays', 'multiDaysRange'].forEach(k => {
            this.form.get(k).valueChanges.subscribe(() => {
                this.multiDaysChanged();
            });
        });

        this.courtAddressControl.valueChanges.subscribe(val => {
            const id = val;
            if (id !== null) {
                const venue = this.availableCourts.find(c => c.id === id);
                this.selectedCourtName = venue.name;
                this.selectedCourtCode = venue.code;
            }
        });
    }

    setUpDateControls() {
        this.datesFormArray.clear(); // Clear existing form controls
        this.hearingsInGroupToEdit = this.hearing.hearingsInGroup.filter(
            x => x.scheduled_date_time >= this.hearing.originalScheduledDateTime
        );
        this.hearingsInGroupToEdit.forEach(hearing => {
            const date = this.datePipe.transform(hearing.scheduled_date_time, 'yyyy-MM-dd');
            const dateControl = new FormControl(date, Validators.required); // Use FormControl for the date
            this.datesFormArray.push(dateControl); // Push the FormControl into the FormArray
            this.hearingIds.push(hearing.hearing_id);
        });
        this.datesFormArray.setValidators(uniqueDateValidator);
    }

    getHearingIdForDate(index: number): string {
        return this.hearingIds[index];
    }

    addHearingDate() {
        this.addHearingDateControl = new FormControl(null, [Validators.required, pastDateValidator()]);
    }

    hearingDateChanged(event: any) {
        if (this.isAddHearingControlValid()) {
            this.addValidHearingDate(event.target.value);
        }
    }

    addValidHearingDate(value: string) {
        this.hearingDates.push(new Date(value));
        this.hearingDates.sort((a, b) => (a.valueOf() < b.valueOf() ? -1 : 1));
        this.addHearingDateControl = null;
    }

    isAddHearingControlValid() {
        return this.addHearingDateControl.valid && !this.isDateAlreadySelected();
    }

    isDateAlreadySelected() {
        const value = this.addHearingDateControl.value;
        if (value) {
            const date = new Date(value).setHours(0, 0, 0, 0);
            return this.hearingDates.map(x => x.setHours(0, 0, 0, 0)).some(x => x === date);
        } else {
            return false;
        }
    }

    removeHearingDate(index: number) {
        this.hearingDates.splice(index, 1);
    }

    get hearingDateControl() {
        return this.form.get('hearingDate');
    }

    get endHearingDateControl() {
        return this.form.get('endHearingDate');
    }

    get hearingStartTimeHourControl() {
        return this.form.get('hearingStartTimeHour');
    }

    get hearingStartTimeMinuteControl() {
        return this.form.get('hearingStartTimeMinute');
    }

    get hearingDurationHourControl() {
        return this.form.get('hearingDurationHour');
    }

    get hearingDurationMinuteControl() {
        return this.form.get('hearingDurationMinute');
    }

    get courtAddressControl() {
        return this.form.get('courtAddress');
    }

    get courtRoomControl() {
        return this.form.get('courtRoom');
    }

    get multiDaysRangeControl() {
        return this.form.get('multiDaysRange');
    }

    get multiDaysControl() {
        return this.form.get('multiDays');
    }

    get hearingDateInvalid() {
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        return (
            (this.hearingDateControl.invalid || new Date(this.hearingDateControl.value) < todayDate) &&
            (this.hearingDateControl.dirty || this.hearingDateControl.touched || this.failedSubmission)
        );
    }

    get endHearingDateInvalid() {
        if (this.multiDaysHearing) {
            const endDateNoTime = new Date(new Date(this.endHearingDateControl.value).setHours(0, 0, 0));
            const startDateNoTime = new Date(new Date(this.hearingDateControl.value).setHours(0, 0, 0));

            this.endDateEarlierThanStartDate = endDateNoTime <= startDateNoTime;
            return (
                (this.endHearingDateControl.invalid || this.endDateEarlierThanStartDate) &&
                (this.endHearingDateControl.dirty || this.endHearingDateControl.touched || this.failedSubmission)
            );
        }
        return false;
    }

    get durationInvalid() {
        if (this.showDurationControls) {
            let hearingDuration = parseInt(this.form.value.hearingDurationHour, 10) * 60;
            hearingDuration += parseInt(this.form.value.hearingDurationMinute, 10);
            return hearingDuration <= 0;
        }
        return false;
    }

    get hearingStartTimeHourInvalid() {
        return (
            this.hearingStartTimeHourControl.invalid &&
            (this.hearingStartTimeHourControl.dirty || this.hearingStartTimeHourControl.touched || this.failedSubmission)
        );
    }

    startHoursInPast() {
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        const realDate = new Date(new Date(this.hearingDateControl.value).setHours(0, 0, 0, 0));
        const todayHours = new Date().getHours();
        this.isStartMinutesInPast = false;
        this.isStartHoursInPast =
            realDate.toString() === todayDate.toString() &&
            this.hearingStartTimeHourControl.value < todayHours &&
            (this.hearingStartTimeHourControl.dirty || this.hearingStartTimeHourControl.touched);
    }

    startMinutesInPast() {
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        const realDate = new Date(new Date(this.hearingDateControl.value).setHours(0, 0, 0, 0));
        const todayHours = new Date().getHours();
        const todayMinutes = new Date().getMinutes();
        this.isStartMinutesInPast =
            realDate.toString() === todayDate.toString() &&
            this.hearingStartTimeHourControl.value === todayHours &&
            this.hearingStartTimeMinuteControl.value <= todayMinutes &&
            (this.hearingStartTimeMinuteControl.dirty || this.hearingStartTimeMinuteControl.touched);
    }

    get hearingStartTimeMinuteInvalid() {
        return (
            this.hearingStartTimeMinuteControl.invalid &&
            (this.hearingStartTimeMinuteControl.dirty || this.hearingStartTimeMinuteControl.touched || this.failedSubmission)
        );
    }

    get hearingDurationHourInvalid() {
        return (
            this.hearingDurationHourControl.invalid &&
            (this.hearingDurationHourControl.dirty || this.hearingDurationHourControl.touched || this.failedSubmission)
        );
    }

    get hearingDurationMinuteInvalid() {
        return (
            this.hearingDurationMinuteControl.invalid &&
            (this.hearingDurationMinuteControl.dirty || this.hearingDurationMinuteControl.touched || this.failedSubmission)
        );
    }

    get courtAddressInvalid() {
        return (
            this.courtAddressControl.invalid &&
            (this.courtAddressControl.dirty || this.courtAddressControl.touched || this.failedSubmission)
        );
    }

    get courtRoomInvalid() {
        return this.courtRoomControl.invalid && (this.courtRoomControl.dirty || this.courtRoomControl.touched || this.failedSubmission);
    }

    get newDatesInvalid() {
        return this.datesFormArray.invalid && (this.datesFormArray.dirty || this.datesFormArray.touched || this.failedSubmission);
    }

    get areNewDatesUnique() {
        return !this.datesFormArray.errors?.nonUniqueDates;
    }

    private retrieveCourts() {
        this.logger.debug(`${this.loggerPrefix} Retrieving courts.`);

        this.refDataService.getCourts().subscribe({
            next: data => {
                this.availableCourts = data;
                this.logger.debug(`${this.loggerPrefix} Updating list of available courts.`, { courts: data.length });
                const pleaseSelect = new HearingVenueResponse();
                pleaseSelect.name = Constants.PleaseSelect;
                pleaseSelect.id = -1;
                this.availableCourts.unshift(pleaseSelect);
                this.setVenueForExistingHearing();
            },
            error: error => {
                this.logger.error(`${this.loggerPrefix} Failed to get courts available.`, error);
                this.errorService.handleError(error);
            }
        });
    }

    setVenueForExistingHearing() {
        if (this.isExistinHearing && this.availableCourts && this.availableCourts.length > 0) {
            const selectedCourts = this.availableCourts.filter(x => x.name === this.hearing.court_name);
            if (selectedCourts && selectedCourts.length > 0) {
                this.selectedCourtName = selectedCourts[0].name;
                this.selectedCourtCode = selectedCourts[0].code;
                this.form.get('courtAddress').setValue(selectedCourts[0].id);
            }
        }
    }

    resetPastTimeOnBlur() {
        this.isStartHoursInPast = false;
        this.isStartMinutesInPast = false;
    }

    finalCheckStartDateTimeInPast(): boolean {
        const todayDate = new Date(Date.now());
        const realDate = new Date(
            new Date(this.hearingDateControl.value).setHours(
                this.hearingStartTimeHourControl.value,
                this.hearingStartTimeMinuteControl.value,
                0,
                0
            )
        );
        if (realDate < todayDate) {
            this.isStartHoursInPast = true;
            this.isStartMinutesInPast = true;
        }
        return realDate > todayDate;
    }

    save() {
        if (this.form.get('multiDays').value && !this.form.get('multiDaysRange').value && this.hearingDates.length) {
            this.form.get('hearingDate').setValue(this.hearingDates[0]);
            this.saveMultiIndividualDayHearing();
        } else if (this.hearing.isMultiDayEdit) {
            this.saveMultipleHearingEdit();
        } else {
            this.saveSingleDayOrMultiDayRangeHearing();
        }
    }

    get isMultiIndividualDayHearingValid() {
        return this.form.valid && !this.addHearingDateControl && this.hearingDates.length > 0;
    }

    get isSingleDayOrMultiDayRangeHearingValid() {
        return (
            this.form.valid &&
            !this.hearingDateInvalid &&
            !this.isStartHoursInPast &&
            !this.isStartMinutesInPast &&
            !this.durationInvalid &&
            !this.endHearingDateInvalid &&
            this.finalCheckStartDateTimeInPast()
        );
    }

    get isMultipleHearingEditValid() {
        return !this.newDatesInvalid;
    }

    get showDurationControls() {
        return !this.multiDaysHearing || this.multiDayBookingEnhancementsEnabled;
    }

    saveMultiIndividualDayHearing() {
        if (this.isMultiIndividualDayHearingValid) {
            this.logger.debug(`${this.loggerPrefix} Updating booking schedule and location.`);

            this.updateHearingRequestForMultiIndividualDays();
            this.form.markAsPristine();
            this.hasSaved = true;

            this.continue();
        } else {
            this.logger.debug(`${this.loggerPrefix} Failed to update booking schedule and location. Form is not valid.`);
            this.failedSubmission = true;
        }
    }

    saveSingleDayOrMultiDayRangeHearing() {
        if (this.isSingleDayOrMultiDayRangeHearingValid) {
            this.logger.debug(`${this.loggerPrefix} Updating booking schedule and location.`);
            this.failedSubmission = false;
            this.updateHearingRequest();
            this.form.markAsPristine();
            this.hasSaved = true;

            this.continue();
        } else {
            this.logger.debug(`${this.loggerPrefix} Failed to update booking schedule and location. Form is not valid.`);
            this.failedSubmission = true;
        }
    }

    saveMultipleHearingEdit() {
        if (this.isMultipleHearingEditValid) {
            this.updateHearingRequestForMultipleHearingEdit();
            this.form.markAsPristine();
            this.hasSaved = true;

            this.continue();
        } else {
            this.logger.debug(`${this.loggerPrefix} Failed to update booking schedule and location. Form is not valid.`);
            this.failedSubmission = true;
        }
    }

    private continue() {
        if (this.editMode) {
            this.logger.debug(`${this.loggerPrefix} In edit mode. Returning to summary page.`);
            this.router.navigate([PageUrls.Summary]);
        } else if (this.addJudciaryMembersFeatureEnabled) {
            this.logger.debug(`${this.loggerPrefix} Navigating to add joh page.`);
            this.router.navigate([PageUrls.AddJudicialOfficeHolders]);
        } else {
            this.logger.debug(`${this.loggerPrefix} Navigating to judge assignment.`);
            this.router.navigate([PageUrls.AssignJudge]);
        }
    }

    private updateHearingRequest() {
        this.hearing.hearing_venue_id = this.form.value.courtAddress;
        this.hearing.court_room = this.form.value.courtRoom;
        this.hearing.court_name = this.selectedCourtName;
        this.hearing.court_code = this.selectedCourtCode;
        const hearingDate = new Date(this.form.value.hearingDate);

        hearingDate.setHours(this.form.value.hearingStartTimeHour, this.form.value.hearingStartTimeMinute);

        this.hearing.scheduled_date_time = hearingDate;
        this.hearing.scheduled_duration = this.setHearingDuration();
        this.hearing.isMultiDayEdit = this.multiDaysHearing;
        this.hearing.hearing_dates = [];
        const endDate = new Date(this.form.value.endHearingDate);
        this.hearing.end_hearing_date_time = endDate;
        this.hearingService.updateHearingRequest(this.hearing);
        this.logger.info(`${this.loggerPrefix} Updated hearing request schedule and location`, { hearing: this.hearing });
    }

    private updateHearingRequestForMultiIndividualDays() {
        this.hearing.hearing_venue_id = this.form.value.courtAddress;
        this.hearing.court_room = this.form.value.courtRoom;
        this.hearing.court_name = this.selectedCourtName;
        this.hearing.court_code = this.selectedCourtCode;

        const hearingDate = this.hearingDates[0];
        hearingDate.setHours(this.form.value.hearingStartTimeHour, this.form.value.hearingStartTimeMinute);
        this.hearing.scheduled_date_time = hearingDate;
        this.hearing.scheduled_duration = this.setHearingDuration();
        this.hearing.isMultiDayEdit = true;
        this.hearing.hearing_dates = [];

        this.hearingDates.forEach(date => {
            date.setHours(this.form.value.hearingStartTimeHour, this.form.value.hearingStartTimeMinute);
            this.hearing.hearing_dates.push(date);
        });

        this.hearingService.updateHearingRequest(this.hearing);
        this.logger.info(`${this.loggerPrefix} Updated hearing request schedule and location`, { hearing: this.hearing });
    }

    private updateHearingRequestForMultipleHearingEdit() {
        this.hearing.hearing_venue_id = this.form.value.courtAddress;
        this.hearing.court_room = this.form.value.courtRoom;
        this.hearing.court_name = this.selectedCourtName;
        this.hearing.court_code = this.selectedCourtCode;

        const dates = this.form.value.dates;
        dates.forEach((date: string, index: number) => {
            const hearingId = this.getHearingIdForDate(index);
            const hearingInGroup = this.hearing.hearingsInGroup.find(x => x.hearing_id === hearingId);
            const newDate = new Date(date);
            newDate.setHours(this.form.value.hearingStartTimeHour, this.form.value.hearingStartTimeMinute);
            hearingInGroup.scheduled_date_time = newDate;
        });

        // Update the start and end dates in the hearing model, so that they are displayed correctly on the summary page
        const hearingsInGroup = this.hearingsInGroupToEdit;
        const hearingCount = hearingsInGroup.length;
        this.hearing.scheduled_date_time = hearingsInGroup[0].scheduled_date_time;
        this.hearing.multiDayHearingLastDayScheduledDateTime = hearingsInGroup[hearingCount - 1].scheduled_date_time;

        this.hearingService.updateHearingRequest(this.hearing);
        this.logger.info(`${this.loggerPrefix} Updated hearing request schedule and location`, { hearing: this.hearing });
    }

    private setHearingDuration() {
        let hearingDuration = 0;
        if (this.showDurationControls) {
            hearingDuration = parseInt(this.form.value.hearingDurationHour, 10) * 60;
            hearingDuration += parseInt(this.form.value.hearingDurationMinute, 10);
        }
        return hearingDuration;
    }

    continueBooking() {
        this.logger.debug(`${this.loggerPrefix} Rejected cancellation. Continuing with booking.`);
        this.attemptingCancellation = false;
        this.attemptingDiscardChanges = false;
    }

    confirmCancelBooking() {
        this.logger.debug(`${this.loggerPrefix} Attempting to cancel booking.`);
        if (this.editMode) {
            if (this.form.dirty || this.form.touched) {
                this.logger.debug(`${this.loggerPrefix} In edit mode. Changes found. Confirm if changes should be discarded.`);
                this.attemptingDiscardChanges = true;
            } else {
                this.logger.debug(`${this.loggerPrefix} In edit mode. No changes. Returning to summary.`);
                this.navigateToSummary();
            }
        } else {
            this.logger.debug(`${this.loggerPrefix} New booking. Confirm if changes should be cancelled.`);
            this.attemptingCancellation = true;
        }
    }

    cancelBooking() {
        this.logger.debug(`${this.loggerPrefix} Cancelling booking and returning to dashboard.`);
        this.attemptingCancellation = false;
        this.hearingService.cancelRequest();
        this.form.reset();
        this.router.navigate([PageUrls.Dashboard]);
    }

    cancelChanges() {
        this.logger.debug(`${this.loggerPrefix} Resetting changes. Returning to summary.`);
        this.attemptingDiscardChanges = false;
        this.form.reset();
        this.navigateToSummary();
    }

    goToDiv(fragment: string): void {
        window.document.getElementById(fragment).parentElement.parentElement.scrollIntoView();
    }

    courtRoomOnBlur() {
        const text = SanitizeInputText(this.courtRoomControl.value);
        this.courtRoomControl.setValue(text);
    }

    private multiDaysChanged() {
        const previouslyShowedDurationControls = this.showDurationControls;

        if (this.multiDaysControl.value) {
            this.multiDaysHearing = true;

            if (this.multiDaysRangeControl.value) {
                this.endHearingDateControl.setValidators([Validators.required, pastDateValidator()]);
                this.endHearingDateControl.updateValueAndValidity();
                this.endHearingDateControl.setValue(null);
            } else {
                this.endHearingDateControl.clearValidators();
                this.endHearingDateControl.updateValueAndValidity();
                this.endHearingDateControl.setValue(null);
            }
        } else {
            this.multiDaysHearing = false;

            this.endHearingDateControl.clearValidators();
            this.endHearingDateControl.updateValueAndValidity();
            this.endHearingDateControl.setValue(null);
        }

        if (previouslyShowedDurationControls && !this.showDurationControls) {
            this.hearingDurationHourControl.setValue('');
            this.hearingDurationMinuteControl.setValue('');
            this.hearingDurationHourControl.markAsUntouched();
            this.hearingDurationHourControl.markAsPristine();
            this.hearingDurationMinuteControl.markAsUntouched();
            this.hearingDurationMinuteControl.markAsPristine();

            this.hearingDurationHourControl.clearValidators();
            this.hearingDurationMinuteControl.clearValidators();
            this.hearingDurationHourControl.updateValueAndValidity();
            this.hearingDurationMinuteControl.updateValueAndValidity();
        }

        if (!previouslyShowedDurationControls && this.showDurationControls) {
            this.hearingDurationHourControl.setValidators([Validators.required, Validators.min(0), Validators.max(23)]);
            this.hearingDurationHourControl.updateValueAndValidity();
            this.hearingDurationMinuteControl.setValidators([Validators.required, Validators.min(0), Validators.max(59)]);
            this.hearingDurationMinuteControl.updateValueAndValidity();
        }
    }

    ngOnDestroy() {
        this.bookingService.removeEditMode();
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    formatDate(date: Date): string {
        return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
    }
}
