import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { HearingModel } from '../../common/model/hearing.model';
import { BookingBaseComponent } from '../booking-base/booking-base.component';
import { BookingService } from '../../services/booking.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Constants } from '../../common/constants';

@Component({
  selector: 'app-other-information',
  templateUrl: './other-information.component.html',
  styleUrls: ['./other-information.component.css']
})
export class OtherInformationComponent extends BookingBaseComponent implements OnInit {
  constants = Constants;
  hearing: HearingModel;
  attemptingCancellation = false;
  attemptingDiscardChanges = false;
  canNavigate = true;

  otherInformationText: string;
  otherInformation: FormControl;

  constructor(private fb: FormBuilder, protected videoHearingService: VideoHearingsService,
    protected router: Router, protected bookingService: BookingService) {
    super(bookingService, router, videoHearingService);
  }

  ngOnInit() {
    this.checkForExistingRequest();
    this.initForm();
    super.ngOnInit();
  }

  private initForm() {
    this.otherInformation = new FormControl(this.otherInformationText ? this.otherInformationText : '',
      Validators.pattern(Constants.TextInputPattern));

    this.form = this.fb.group({
      otherInformation: this.otherInformation,
    });
  }

  get otherInformationInvalid() {
    return this.otherInformation.invalid && (this.otherInformation.dirty || this.otherInformation.touched);
  }

  private checkForExistingRequest() {
    this.hearing = this.videoHearingService.getCurrentRequest();
    this.otherInformationText = this.hearing.other_information;
  }

  next() {
    this.hearing.other_information = this.otherInformation.value;
    this.videoHearingService.updateHearingRequest(this.hearing);
    this.form.markAsPristine();
    if (this.editMode) {
      this.resetEditMode();
    }
    this.router.navigate([PageUrls.Summary]);
  }

  cancelBooking() {
    this.attemptingCancellation = false;
    this.videoHearingService.cancelRequest();
    this.form.reset();
    this.router.navigate([PageUrls.Dashboard]);
  }

  cancelChanges() {
    this.attemptingDiscardChanges = false;
    this.form.reset();
    this.navigateToSummary();
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
}
