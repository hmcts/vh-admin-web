import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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

@Component({
    selector: 'app-hearing-schedule',
    templateUrl: './hearing-schedule.component.html',
    styleUrls: ['./hearing-schedule.component.css']
})
export class HearingScheduleComponent extends BookingBaseComponent implements OnInit, AfterViewInit, OnDestroy {
    hearing: HearingModel;
    availableCourts: HearingVenueResponse[];
    failedSubmission: boolean;
    attemptingCancellation = false;
    attemptingDiscardChanges = false;
    hasSaved = false;
    today = new Date();
    canNavigate = true;
    selectedCourtName: string;
    isExistinHearing: boolean;
    isStartHoursInPast = false;
    isStartMinutesInPast = false;
    $subscriptions: Subscription[] = [];
    multiDaysHearing = false;
    durationHourControl: FormControl;
    durationMinuteControl: FormControl;
    isBookedHearing = false;
    constructor(
        private refDataService: ReferenceDataService,
        protected hearingService: VideoHearingsService,
        private fb: FormBuilder,
        protected router: Router,
        private datePipe: DatePipe,
        protected bookingService: BookingService,
        private errorService: ErrorService,
        protected logger: Logger
    ) {
        super(bookingService, router, hearingService, logger);
    }

    ngOnInit() {
        this.failedSubmission = false;
        this.checkForExistingRequest();
        this.retrieveCourts();
        this.initForm();
        super.ngOnInit();
    }

    private checkForExistingRequest() {
        this.hearing = this.hearingService.getCurrentRequest();
        this.isExistinHearing = this.hearing && this.hearing.hearing_type_name && this.hearing.hearing_type_name.length > 0;
        this.isBookedHearing =
            this.hearing && this.hearing.hearing_id !== undefined && this.hearing.hearing_id !== null && this.hearing.hearing_id.length > 0;
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

            this.multiDaysHearing = this.hearing.multiDays;
        }

        if (this.multiDaysHearing) {
            this.durationHourControl = new FormControl(durationHour);
            this.durationMinuteControl = new FormControl(durationMinute);
        } else {
            this.durationHourControl = new FormControl(durationHour, [Validators.required, Validators.min(0), Validators.max(23)]);
            this.durationMinuteControl = new FormControl(durationMinute, [Validators.required, Validators.min(0), Validators.max(59)]);
        }

        this.form = this.fb.group({
            hearingDate: [hearingDateParsed, Validators.required],
            hearingStartTimeHour: [startTimeHour, [Validators.required, Validators.min(0), Validators.max(23)]],
            hearingStartTimeMinute: [startTimeMinute, [Validators.required, Validators.min(0), Validators.max(59)]],
            hearingDurationHour: this.durationHourControl,
            hearingDurationMinute: this.durationMinuteControl,
            courtAddress: [this.hearing.hearing_venue_id, [Validators.required, Validators.min(1)]],
            courtRoom: [room, [Validators.pattern(Constants.TextInputPattern), Validators.maxLength(255)]],
            multiDays: [this.multiDaysHearing],
            endHearingDate: [endHearingDateParsed]
        });
    }

    ngAfterViewInit() {
        if (this.courtAddress) {
            this.$subscriptions.push(
                this.courtAddress.valueChanges.subscribe(val => {
                    const id = val;
                    if (id !== null) {
                        this.selectedCourtName = this.availableCourts.find(c => c.id === id).name;
                    }
                })
            );
        }
    }

    get hearingDate() {
        return this.form.get('hearingDate');
    }

    get endHearingDate() {
        return this.form.get('endHearingDate');
    }

    get hearingStartTimeHour() {
        return this.form.get('hearingStartTimeHour');
    }

    get hearingStartTimeMinute() {
        return this.form.get('hearingStartTimeMinute');
    }

    get hearingDurationHour() {
        return this.form.get('hearingDurationHour');
    }

    get hearingDurationMinute() {
        return this.form.get('hearingDurationMinute');
    }

    get courtAddress() {
        return this.form.get('courtAddress');
    }

    get courtRoom() {
        return this.form.get('courtRoom');
    }

    get hearingDateInvalid() {
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        return (
            (this.hearingDate.invalid || new Date(this.hearingDate.value) < todayDate) &&
            (this.hearingDate.dirty || this.hearingDate.touched || this.failedSubmission)
        );
    }

    get endHearingDateInvalid() {
        if (this.multiDaysHearing) {
            const endDateNoTime = new Date(new Date(this.endHearingDate.value).setHours(0, 0, 0));
            const startDateNoTime = new Date(new Date(this.hearingDate.value).setHours(0, 0, 0));

            const compareStartInvalid = endDateNoTime <= startDateNoTime;

            return (
                (this.endHearingDate.invalid || compareStartInvalid) &&
                (this.endHearingDate.dirty || this.endHearingDate.touched || this.failedSubmission)
            );
        }
        return false;
    }

    get durationInvalid() {
        if (!this.multiDaysHearing) {
            let hearingDuration = parseInt(this.form.value.hearingDurationHour, 10) * 60;
            hearingDuration += parseInt(this.form.value.hearingDurationMinute, 10);
            return hearingDuration <= 0;
        }
        return false;
    }

    get hearingStartTimeHourInvalid() {
        return (
            this.hearingStartTimeHour.invalid &&
            (this.hearingStartTimeHour.dirty || this.hearingStartTimeHour.touched || this.failedSubmission)
        );
    }

    startHoursInPast() {
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        const realDate = new Date(new Date(this.hearingDate.value).setHours(0, 0, 0, 0));
        const todayHours = new Date().getHours();
        this.isStartMinutesInPast = false;
        this.isStartHoursInPast =
            realDate.toString() === todayDate.toString() &&
            this.hearingStartTimeHour.value < todayHours &&
            (this.hearingStartTimeHour.dirty || this.hearingStartTimeHour.touched);
    }

    startMinutesInPast() {
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        const realDate = new Date(new Date(this.hearingDate.value).setHours(0, 0, 0, 0));
        const todayHours = new Date().getHours();
        const todayMinutes = new Date().getMinutes();
        this.isStartMinutesInPast =
            realDate.toString() === todayDate.toString() &&
            this.hearingStartTimeHour.value === todayHours &&
            this.hearingStartTimeMinute.value <= todayMinutes &&
            (this.hearingStartTimeMinute.dirty || this.hearingStartTimeMinute.touched);
    }

    get hearingStartTimeMinuteInvalid() {
        return (
            this.hearingStartTimeMinute.invalid &&
            (this.hearingStartTimeMinute.dirty || this.hearingStartTimeMinute.touched || this.failedSubmission)
        );
    }

    get hearingDurationHourInvalid() {
        return (
            this.hearingDurationHour.invalid &&
            (this.hearingDurationHour.dirty || this.hearingDurationHour.touched || this.failedSubmission)
        );
    }

    get hearingDurationMinuteInvalid() {
        return (
            this.hearingDurationMinute.invalid &&
            (this.hearingDurationMinute.dirty || this.hearingDurationMinute.touched || this.failedSubmission)
        );
    }

    get courtAddressInvalid() {
        return this.courtAddress.invalid && (this.courtAddress.dirty || this.courtAddress.touched || this.failedSubmission);
    }

    get courtRoomInvalid() {
        return this.courtRoom.invalid && (this.courtRoom.dirty || this.courtRoom.touched || this.failedSubmission);
    }

    private retrieveCourts() {
        this.logger.debug(`${this.loggerPrefix} Retrieving courts.`);
        this.$subscriptions.push(
            this.refDataService.getCourts().subscribe(
                (data: HearingVenueResponse[]) => {
                    this.availableCourts = data;
                    this.logger.debug(`${this.loggerPrefix} Updating list of available courts.`, { courts: data.length });
                    const pleaseSelect = new HearingVenueResponse();
                    pleaseSelect.name = Constants.PleaseSelect;
                    pleaseSelect.id = -1;
                    this.availableCourts.unshift(pleaseSelect);
                    this.setVenueForExistingHearing();
                },
                error => {
                    this.logger.error(`${this.loggerPrefix} Failed to get courts available.`, error);
                    this.errorService.handleError(error);
                }
            )
        );
    }

    setVenueForExistingHearing() {
        if (this.isExistinHearing && this.availableCourts && this.availableCourts.length > 0) {
            const selectedCourts = this.availableCourts.filter(x => x.name === this.hearing.court_name);
            if (selectedCourts && selectedCourts.length > 0) {
                this.selectedCourtName = selectedCourts[0].name;
                this.form.get('courtAddress').setValue(selectedCourts[0].id);
            }
        }
    }

    resetPastTimeOnBlur() {
        // reset flag if the date was changed
        this.isStartHoursInPast = false;
        this.isStartMinutesInPast = false;
    }

    finalCheckStartDateTimeInPast(): boolean {
        const todayDate = new Date(Date.now());
        const realDate = new Date(
            new Date(this.hearingDate.value).setHours(this.hearingStartTimeHour.value, this.hearingStartTimeMinute.value, 0, 0)
        );
        if (realDate < todayDate) {
            this.isStartHoursInPast = true;
            this.isStartMinutesInPast = true;
        }
        return realDate > todayDate;
    }

    saveScheduleAndLocation() {
        if (
            this.form.valid &&
            !this.hearingDateInvalid &&
            !this.isStartHoursInPast &&
            !this.isStartMinutesInPast &&
            !this.durationInvalid &&
            !this.endHearingDateInvalid &&
            this.finalCheckStartDateTimeInPast()
        ) {
            this.logger.debug(`${this.loggerPrefix} Updating booking schedule and location.`);
            this.failedSubmission = false;
            this.updateHearingRequest();
            this.form.markAsPristine();
            this.hasSaved = true;
            if (this.editMode) {
                this.logger.debug(`${this.loggerPrefix} In edit mode. Returning to summary page.`);
                this.router.navigate([PageUrls.Summary]);
            } else {
                this.logger.debug(`${this.loggerPrefix} Navigating to judge assignment.`);
                this.router.navigate([PageUrls.AssignJudge]);
            }
        } else {
            this.logger.debug(`${this.loggerPrefix} Failed to update booking schedule and location. Form is not valid.`);
            this.failedSubmission = true;
        }
    }

    private updateHearingRequest() {
        this.hearing.hearing_venue_id = this.form.value.courtAddress;
        this.hearing.court_room = this.form.value.courtRoom;
        this.hearing.court_name = this.selectedCourtName;
        const hearingDate = new Date(this.form.value.hearingDate);

        hearingDate.setHours(this.form.value.hearingStartTimeHour, this.form.value.hearingStartTimeMinute);

        this.hearing.scheduled_date_time = hearingDate;
        this.hearing.scheduled_duration = this.setHearingDuration();
        this.hearing.multiDays = this.multiDaysHearing;
        const endDate = new Date(this.form.value.endHearingDate);
        this.hearing.end_hearing_date_time = endDate;
        this.hearingService.updateHearingRequest(this.hearing);
        this.logger.info(`${this.loggerPrefix} Updated hearing request schedule and location`, { hearing: this.hearing });
    }

    private setHearingDuration() {
        let hearingDuration = 0;
        if (!this.multiDaysHearing) {
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
        const text = SanitizeInputText(this.courtRoom.value);
        this.courtRoom.setValue(text);
    }

    multiDaysChanged(value) {
        if (value) {
            this.multiDaysHearing = true;
            this.hearingDurationHour.clearValidators();
            this.hearingDurationMinute.clearValidators();
            this.hearingDurationHour.updateValueAndValidity();
            this.hearingDurationMinute.updateValueAndValidity();

            this.hearingDurationHour.setValue('');
            this.hearingDurationMinute.setValue('');
            this.hearingDurationHour.markAsUntouched();
            this.hearingDurationHour.markAsPristine();
            this.hearingDurationMinute.markAsUntouched();
            this.hearingDurationMinute.markAsPristine();

            this.endHearingDate.setValidators([Validators.required]);
            this.endHearingDate.updateValueAndValidity();
            this.endHearingDate.setValue(null);
        } else {
            this.multiDaysHearing = false;
            this.endHearingDate.clearValidators();
            this.endHearingDate.updateValueAndValidity();
            this.endHearingDate.setValue(null);

            this.hearingDurationHour.setValidators([Validators.required, Validators.min(0), Validators.max(23)]);
            this.hearingDurationHour.updateValueAndValidity();
            this.hearingDurationMinute.setValidators([Validators.required, Validators.min(0), Validators.max(59)]);
            this.hearingDurationMinute.updateValueAndValidity();
        }
    }

    ngOnDestroy() {
        this.bookingService.removeEditMode();
        this.$subscriptions.forEach(subscription => {
            if (subscription) {
                subscription.unsubscribe();
            }
        });
    }
}
