import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CanDeactiveComponent } from '../../common/guards/changes.guard';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { HearingModel } from '../../common/model/hearing.model';

@Component({
  selector: 'app-other-information',
  templateUrl: './other-information.component.html',
  styleUrls: ['./other-information.component.css']
})
export class OtherInformationComponent implements OnInit, CanDeactiveComponent {
  hearing: HearingModel;
  attemptingCancellation: boolean;
  canNavigate = true;
  otherInformationForm: FormGroup;
  otherInformationText: string;

  constructor(private fb: FormBuilder, private videoHearingService: VideoHearingsService, private router: Router) {
    this.attemptingCancellation = false;
  }

  ngOnInit() {
    this.checkForExistingRequest();
    this.initForm();
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
    this.router.navigate(['/summary']);
  }

  cancelBooking() {
    this.attemptingCancellation = false;
    this.videoHearingService.cancelRequest();
    this.otherInformationForm.reset();
    this.router.navigate(['/dashboard']);
  }
  
  continueBooking() {
    this.attemptingCancellation = false;
  }

  confirmCancelBooking() {
    this.attemptingCancellation = true;
  }

  hasChanges(): Observable<boolean> | boolean {
    this.confirmCancelBooking();
    return true;
  }
}
