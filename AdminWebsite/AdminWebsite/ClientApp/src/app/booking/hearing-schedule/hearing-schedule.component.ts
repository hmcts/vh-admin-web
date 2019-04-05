import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { CanDeactiveComponent } from '../../common/guards/changes.guard';
import { HearingModel } from '../../common/model/hearing.model';
import { ReferenceDataService } from '../../services/reference-data.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingBaseComponent } from '../booking-base/booking-base.component';
import { BookingService } from '../../services/booking.service';
import { ErrorService } from 'src/app/services/error.service';
import { HearingVenueResponse } from '../../services/clients/api-client';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
  selector: 'app-hearing-schedule',
  templateUrl: './hearing-schedule.component.html',
  styleUrls: ['./hearing-schedule.component.css']
})
export class HearingScheduleComponent extends BookingBaseComponent implements OnInit, CanDeactiveComponent {

  hearing: HearingModel;
  availableCourts: HearingVenueResponse[];
  schedulingForm: FormGroup;
  failedSubmission: boolean;
  attemptingCancellation = false;
  attemptingDiscardChanges = false;
  hasSaved = false;
  today = new Date();
  canNavigate = true;
  selectedCourtName: string;
  isExistinHearing: boolean;

  constructor(private refDataService: ReferenceDataService, private hearingService: VideoHearingsService,
    private fb: FormBuilder, protected router: Router,
    private datePipe: DatePipe, protected bookingService: BookingService,
    private errorService: ErrorService) {
    super(bookingService, router);
  }

  ngOnInit() {
    super.ngOnInit();
    this.failedSubmission = false;
    this.checkForExistingRequest();
    this.retrieveCourts();
    this.initForm();
  }

  private checkForExistingRequest() {
    this.hearing = this.hearingService.getCurrentRequest();
    this.isExistinHearing = this.hearing && this.hearing.hearing_id && this.hearing.hearing_id.length > 0;
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
    console.log(this.hearing.hearing_venue_id);
    this.schedulingForm = this.fb.group({
      hearingDate: [hearingDateParsed, Validators.required],
      hearingStartTimeHour: [startTimeHour, [Validators.required, Validators.min(0), Validators.max(23)]],
      hearingStartTimeMinute: [startTimeMinute, [Validators.required, Validators.min(0), Validators.max(59)]],
      hearingDurationHour: [durationHour, [Validators.required, Validators.min(0), Validators.max(23)]],
      hearingDurationMinute: [durationMinute, [Validators.required, Validators.min(0), Validators.max(59)]],
      courtAddress: [this.hearing.hearing_venue_id, [Validators.required, Validators.min(1)]],
      courtRoom: [room],
    });

    this.courtAddress.valueChanges.subscribe(val => {
      const id = val;
      if (id !== null) {
        this.selectedCourtName = this.availableCourts.find(c => c.id === id).name;
      }
    });
  }

  get hearingDate() {
    return this.schedulingForm.get('hearingDate');
  }

  get hearingStartTimeHour() {
    return this.schedulingForm.get('hearingStartTimeHour');
  }

  get hearingStartTimeMinute() {
    return this.schedulingForm.get('hearingStartTimeMinute');
  }

  get hearingDurationHour() {
    return this.schedulingForm.get('hearingDurationHour');
  }

  get hearingDurationMinute() {
    return this.schedulingForm.get('hearingDurationMinute');
  }

  get courtAddress() {
    return this.schedulingForm.get('courtAddress');
  }

  get courtRoom() {
    return this.schedulingForm.get('courtRoom');
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

  private retrieveCourts() {
    this.refDataService.getCourts()
      .subscribe(
        (data: HearingVenueResponse[]) => {
          this.availableCourts = data;
          console.log(`courts = ${JSON.stringify(data, null, 2)}`);
          const pleaseSelect = new HearingVenueResponse();
          pleaseSelect.name = 'Please Select';
          pleaseSelect.id = -1;
          this.availableCourts.unshift(pleaseSelect);
          this.setVenueForExistingHearing();
          console.log(`courts = ${JSON.stringify(data, null, 2)}`);
        },
        error => this.errorService.handleError(error)
      );
  }

  setVenueForExistingHearing() {
    if (this.isExistinHearing && this.availableCourts && this.availableCourts.length > 0) {
      const selectedCourts = this.availableCourts.filter(x => x.name === this.hearing.court_name);
      if (selectedCourts && selectedCourts.length > 0) {
        this.selectedCourtName = selectedCourts[0].name;
        this.schedulingForm.get('courtAddress').setValue(selectedCourts[0].id);
      }
    }
  }

  saveScheduleAndLocation() {
    if (this.schedulingForm.valid && !this.hearingDateInvalid) {
      this.failedSubmission = false;
      this.updateHearingRequest();
      this.schedulingForm.markAsPristine();
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
    this.hearing.hearing_venue_id = this.schedulingForm.value.courtAddress;
    this.hearing.court_room = this.schedulingForm.value.courtRoom;
    this.hearing.court_name = this.selectedCourtName;
    console.log(this.hearing.court_room);
    console.log(this.hearing.court_name);
    const hearingDate = new Date(this.schedulingForm.value.hearingDate);

    hearingDate.setHours(
      this.schedulingForm.value.hearingStartTimeHour,
      this.schedulingForm.value.hearingStartTimeMinute
    );

    this.hearing.scheduled_date_time = hearingDate;
    let hearingDuration = (parseInt(this.schedulingForm.value.hearingDurationHour, 10) * 60);
    hearingDuration += parseInt(this.schedulingForm.value.hearingDurationMinute, 10);
    this.hearing.scheduled_duration = hearingDuration;
    this.hearingService.updateHearingRequest(this.hearing);
  }

  continueBooking() {
    this.attemptingCancellation = false;
    this.attemptingDiscardChanges = false;
  }

  confirmCancelBooking() {
    if (this.editMode) {
      if (this.schedulingForm.dirty || this.schedulingForm.touched) {
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
    this.schedulingForm.reset();
    this.router.navigate([PageUrls.Dashboard]);
  }

  cancelChanges() {
    this.attemptingDiscardChanges = false;
    this.schedulingForm.reset();
    this.navigateToSummary();
  }

  goToDiv(fragment: string): void {
    window.document.getElementById(fragment).parentElement.parentElement.scrollIntoView();
  }

  hasChanges(): Observable<boolean> | boolean {
    if (this.schedulingForm.dirty) {
      this.confirmCancelBooking();
    }
    return this.schedulingForm.dirty;
  }
}
