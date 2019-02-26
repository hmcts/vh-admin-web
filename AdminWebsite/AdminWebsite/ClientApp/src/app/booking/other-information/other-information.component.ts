import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CanDeactiveComponent } from '../../common/guards/changes.guard';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { VideoHearingsService } from '../../services/video-hearings.service';

@Component({
  selector: 'app-other-information',
  templateUrl: './other-information.component.html',
  styleUrls: ['./other-information.component.css']
})
export class OtherInformationComponent implements OnInit, CanDeactiveComponent {
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
    this.otherInformationText = this.videoHearingService.getOtherInformation()
  }

  next() {
    this.videoHearingService.setOtherInformation(this.otherInformationForm.value.otherInformation);
    this.otherInformationForm.markAsPristine();
    this.router.navigate(['/summary']);
  }

  otherInformationCancel() {
    this.attemptingCancellation = false;
    this.videoHearingService.cancelRequest();
    this.otherInformationForm.reset();
    this.videoHearingService.removeOtherInformation();
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
