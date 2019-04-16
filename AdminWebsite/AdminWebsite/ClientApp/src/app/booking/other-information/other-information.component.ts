import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { HearingModel } from '../../common/model/hearing.model';
import { BookingBaseComponent } from '../booking-base/booking-base.component';
import { BookingService } from '../../services/booking.service';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
  selector: 'app-other-information',
  templateUrl: './other-information.component.html',
  styleUrls: ['./other-information.component.css']
})
export class OtherInformationComponent extends BookingBaseComponent implements OnInit {
  hearing: HearingModel;
  attemptingCancellation = false;
  attemptingDiscardChanges = false;
  canNavigate = true;
  otherInformationForm: FormGroup;
  otherInformationText: string;

  constructor(private fb: FormBuilder, protected videoHearingService: VideoHearingsService,
    protected router: Router, protected bookingService: BookingService) {
    super(bookingService, router, videoHearingService);
  }

  ngOnInit() {
    super.ngOnInit();
    this.checkForExistingRequest();
    this.initForm();
    this.onChanged(this.otherInformationForm);
  }

  private initForm() {
    this.otherInformationForm = this.fb.group({
      otherInformation: [this.otherInformationText !== null ? this.otherInformationText : ''],
    });
  }

  private checkForExistingRequest() {
    this.hearing = this.videoHearingService.getCurrentRequest();
    this.otherInformationText = this.hearing.other_information;
  }

  next() {
    this.hearing.other_information = this.otherInformationForm.value.otherInformation;
    this.videoHearingService.updateHearingRequest(this.hearing);
    this.otherInformationForm.markAsPristine();
    if (this.editMode) {
      this.resetEditMode();
    }
    this.router.navigate([PageUrls.Summary]);
  }

  cancelBooking() {
    this.attemptingCancellation = false;
    this.videoHearingService.cancelRequest();
    this.otherInformationForm.reset();
    this.router.navigate([PageUrls.Dashboard]);
  }

  cancelChanges() {
    this.attemptingDiscardChanges = false;
    this.otherInformationForm.reset();
    this.navigateToSummary();
  }
  continueBooking() {
    this.attemptingCancellation = false;
    this.attemptingDiscardChanges = false;
  }

  confirmCancelBooking() {
    if (this.editMode) {
      if (this.otherInformationForm.dirty || this.otherInformationForm.touched) {
        this.attemptingDiscardChanges = true;
      } else {
        this.navigateToSummary();
      }
    } else {
      this.attemptingCancellation = true;
    }
  }
}
