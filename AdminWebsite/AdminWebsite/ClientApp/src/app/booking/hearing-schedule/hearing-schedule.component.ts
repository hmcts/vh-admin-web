import { DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HearingModel } from '../../common/model/hearing.model';
import { ReferenceDataService } from '../../services/reference-data.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingBaseComponent } from '../booking-base/booking-base.component';
import { BookingService } from '../../services/booking.service';
import { ErrorService } from 'src/app/services/error.service';
import { HearingVenueResponse } from '../../services/clients/api-client';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Constants } from 'src/app/common/constants';
import { SanitizeInputText } from '../../common/formatters/sanitize-input-text';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-hearing-schedule',
  templateUrl: './hearing-schedule.component.html',
  styleUrls: ['./hearing-schedule.component.css']
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
  isExistinHearing: boolean;
  isStartHoursInPast = false;
  isStartMinutesInPast = false;
  $subscriptions: Subscription[] = [];

  constructor(private refDataService: ReferenceDataService, protected hearingService: VideoHearingsService,
    private fb: FormBuilder, protected router: Router,
    private datePipe: DatePipe, protected bookingService: BookingService,
    private errorService: ErrorService) {
    super(bookingService, router, hearingService);
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
  }

  private initForm() {
    let hearingDateParsed = null;
    let startTimeHour = null;
    let startTimeMinute = null;
    let durationHour = null;
    let durationMinute = null;
    let room = '';

    if (this.hearing && this.hearing.hearing_venue_id === undefined) {
      this.hearing.hearing_venue_id = -1;
    }

    if (this.hearing && this.hearing.scheduled_date_time) {
      const date = new Date(this.hearing.scheduled_date_time);
      hearingDateParsed = this.datePipe.transform(date, 'yyyy-MM-dd');
      startTimeHour = (date.getHours() < 10 ? '0' : '') + date.getHours();
      startTimeMinute = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    }

    if (this.hearing && this.hearing.scheduled_duration) {
      const duration = new Date();
      duration.setHours(0, 0, 0, 0);
      duration.setMinutes(this.hearing.scheduled_duration);
      durationHour = (duration.getHours() < 10 ? '0' : '') + duration.getHours();
      durationMinute = (duration.getMinutes() < 10 ? '0' : '') + duration.getMinutes();
    }

    if (this.hearing && this.hearing.scheduled_date_time && this.hearing.scheduled_duration && this.hearing.hearing_venue_id) {
      this.hasSaved = true;
    }

    if (this.hearing && this.hearing.court_room) {
      room = this.hearing.court_room;
    }
    this.form = this.fb.group({
      hearingDate: [hearingDateParsed, Validators.required],
      hearingStartTimeHour: [startTimeHour, [Validators.required, Validators.min(0), Validators.max(23)]],
      hearingStartTimeMinute: [startTimeMinute, [Validators.required, Validators.min(0), Validators.max(59)]],
      hearingDurationHour: [durationHour, [Validators.required, Validators.min(0), Validators.max(23)]],
      hearingDurationMinute: [durationMinute, [Validators.required, Validators.min(0), Validators.max(59)]],
      courtAddress: [this.hearing.hearing_venue_id, [Validators.required, Validators.min(1)]],
      courtRoom: [room, [Validators.pattern(Constants.TextInputPattern), Validators.maxLength(255)]],
    });

    this.$subscriptions.push(this.courtAddress.valueChanges.subscribe(val => {
      const id = val;
      if (id !== null) {
        this.selectedCourtName = this.availableCourts.find(c => c.id === id).name;
      }
    }));
  }

  get hearingDate() {
    const hearingDateValue = this.form.get('hearingDate');
    return hearingDateValue;
    // return this.form.get('hearingDate');
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
    return (this.hearingDate.invalid || new Date(this.hearingDate.value) < todayDate)
      && (this.hearingDate.dirty || this.hearingDate.touched || this.failedSubmission);
  }

  get hearingStartTimeHourInvalid() {
    return this.hearingStartTimeHour.invalid &&
      (this.hearingStartTimeHour.dirty || this.hearingStartTimeHour.touched || this.failedSubmission);
  }

  startHoursInPast() {
    const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
    const realDate = new Date(new Date(this.hearingDate.value).setHours(0, 0, 0, 0));
    const todayHours = new Date().getHours();

    this.isStartHoursInPast = realDate.toString() === todayDate.toString() && this.hearingStartTimeHour.value < todayHours
      && (this.hearingStartTimeHour.dirty || this.hearingStartTimeHour.touched);
  }

  startMinutesInPast() {
    const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
    const realDate = new Date(new Date(this.hearingDate.value).setHours(0, 0, 0, 0));
    const todayHours = new Date().getHours();
    const todayMinutes = new Date().getMinutes();
    this.isStartMinutesInPast = realDate.toString() === todayDate.toString() && this.hearingStartTimeHour.value === todayHours
      && this.hearingStartTimeMinute.value <= todayMinutes && (this.hearingStartTimeMinute.dirty || this.hearingStartTimeMinute.touched);
  }

  get hearingStartTimeMinuteInvalid() {
    return this.hearingStartTimeMinute.invalid &&
      (this.hearingStartTimeMinute.dirty || this.hearingStartTimeMinute.touched || this.failedSubmission);
  }

  get hearingDurationHourInvalid() {
    return this.hearingDurationHour.invalid &&
      (this.hearingDurationHour.dirty || this.hearingDurationHour.touched || this.failedSubmission);
  }

  get hearingDurationMinuteInvalid() {
    return this.hearingDurationMinute.invalid &&
      (this.hearingDurationMinute.dirty || this.hearingDurationMinute.touched || this.failedSubmission);
  }

  get courtAddressInvalid() {
    return this.courtAddress.invalid && (this.courtAddress.dirty || this.courtAddress.touched || this.failedSubmission);
  }

  get courtRoomInvalid() {
    return this.courtRoom.invalid && (this.courtRoom.dirty || this.courtRoom.touched || this.failedSubmission);
  }

  private retrieveCourts() {
    this.$subscriptions.push(this.refDataService.getCourts()
      .subscribe(
        (data: HearingVenueResponse[]) => {
          this.availableCourts = data;
          const pleaseSelect = new HearingVenueResponse();
          pleaseSelect.name = Constants.PleaseSelect;
          pleaseSelect.id = -1;
          this.availableCourts.unshift(pleaseSelect);
          this.setVenueForExistingHearing();
        },
        error => this.errorService.handleError(error)
      ));
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

  saveScheduleAndLocation() {
    if (this.form.valid && !this.hearingDateInvalid && !this.isStartHoursInPast && !this.isStartMinutesInPast) {
      this.failedSubmission = false;
      this.updateHearingRequest();
      this.form.markAsPristine();
      this.hasSaved = true;
      if (this.editMode) {
        this.navigateToSummary();
      } else {
        this.router.navigate([PageUrls.AssignJudge]);
      }
    } else {
      this.failedSubmission = true;
    }
  }

  private updateHearingRequest() {
    this.hearing.hearing_venue_id = this.form.value.courtAddress;
    this.hearing.court_room = this.form.value.courtRoom;
    this.hearing.court_name = this.selectedCourtName;
    const hearingDate = new Date(this.form.value.hearingDate);

    hearingDate.setHours(
      this.form.value.hearingStartTimeHour,
      this.form.value.hearingStartTimeMinute
    );

    this.hearing.scheduled_date_time = hearingDate;
    let hearingDuration = (parseInt(this.form.value.hearingDurationHour, 10) * 60);
    hearingDuration += parseInt(this.form.value.hearingDurationMinute, 10);
    this.hearing.scheduled_duration = hearingDuration;
    this.hearingService.updateHearingRequest(this.hearing);
  }

  continueBooking() {
    this.attemptingCancellation = false;
    this.attemptingDiscardChanges = false;
  }

  confirmCancelBooking() {
    if (this.editMode) {
      if (this.form.dirty || this.form.touched) {
        this.attemptingDiscardChanges = true;
      } else {
        this.navigateToSummary();
      }
    } else {
      this.attemptingCancellation = true;
    }
  }

  cancelBooking() {
    this.attemptingCancellation = false;
    this.hearingService.cancelRequest();
    this.form.reset();
    this.router.navigate([PageUrls.Dashboard]);
  }

  cancelChanges() {
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

  ngOnDestroy() {
    this.$subscriptions.forEach(subscription => { if (subscription) { subscription.unsubscribe(); } });
  }
}
