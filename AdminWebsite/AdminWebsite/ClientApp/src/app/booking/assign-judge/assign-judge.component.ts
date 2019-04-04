import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CanDeactiveComponent } from 'src/app/common/guards/changes.guard';
import { JudgeResponse } from '../../services/clients/api-client';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';

import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { Constants } from 'src/app/common/constants';
import { JudgeDataService } from 'src/app/booking/services/judge-data.service';
import { BookingService } from '../../services/booking.service';
import { BookingBaseComponent } from '../booking-base/booking-base.component';

@Component({
  selector: 'app-assign-judge',
  templateUrl: './assign-judge.component.html',
  styleUrls: ['./assign-judge.component.css']
})

export class AssignJudgeComponent extends BookingBaseComponent implements OnInit, CanDeactiveComponent {

  hearing: HearingModel;
  judge: JudgeResponse;
  assignJudgeForm: FormGroup;
  failedSubmission: boolean;
  attemptingCancellation = false;
  attemptingDiscardChanges = false;
  hasSaved: boolean;
  canNavigate = false;

  constants = Constants;
  availableJudges: JudgeResponse[];
  isJudgeSelected = true;

  constructor(
    private fb: FormBuilder,
    protected router: Router,
    private hearingService: VideoHearingsService,
    private judgeService: JudgeDataService,
    protected bookingService: BookingService) {
    super(bookingService, router);
  }

  static mapJudge(judge: ParticipantModel): JudgeResponse {
    return new JudgeResponse({
      email: judge.email,
      first_name: judge.first_name,
      last_name: judge.last_name,
      display_name: judge.display_name
    });
  }

  static mapJudgeToModel(judge: JudgeResponse): ParticipantModel {
    const newParticipant = new ParticipantModel();
    newParticipant.title = 'Judge';
    newParticipant.first_name = judge.first_name;
    newParticipant.middle_names = '';
    newParticipant.last_name = judge.last_name;
    newParticipant.display_name = judge.display_name;
    newParticipant.email = judge.email;
    newParticipant.is_judge = true;
    newParticipant.phone = '';
    newParticipant.id = null;
    newParticipant.username = judge.email;
    newParticipant.case_role_name = 'Judge';
    newParticipant.hearing_role_name = 'Judge';
    return newParticipant;
  }

  ngOnInit() {
    super.ngOnInit();
    this.failedSubmission = false;
    this.checkForExistingRequest();
    this.loadJudges();
    this.initForm();
  }

  private checkForExistingRequest() {
    this.hearing = this.hearingService.getCurrentRequest();
  }

  private initForm() {
    const find_judge = this.hearing.participants.find(x => x.is_judge === true);
    if (!find_judge) {
      this.judge = new JudgeResponse({ email: null });
    } else {
      this.judge = AssignJudgeComponent.mapJudge(find_judge);
      this.canNavigate = true;
    }
    this.assignJudgeForm = this.fb.group({
      judgeName: [this.judge.email, Validators.required],
    });

    this.judgeName.valueChanges.subscribe(judgeUserId => {
      this.addJudge(judgeUserId);
      this.isJudgeSelected = judgeUserId !== null;
      this.canNavigate = this.isJudgeSelected;
    });
  }

  get judgeName() { return this.assignJudgeForm.get('judgeName'); }

  get judgeNameInvalid() {
    return this.judgeName.invalid && (this.judgeName.dirty || this.judgeName.touched || this.failedSubmission);
  }

  public addJudge(judgeId: string) {
    if (judgeId) {
      const selectedJudge = this.availableJudges.find(j => j.email === judgeId);
      this.judge.first_name = selectedJudge.first_name;
      this.judge.last_name = selectedJudge.last_name;
      this.judge.email = selectedJudge.email;
      this.judge.display_name = selectedJudge.display_name;

      const newJudge = AssignJudgeComponent.mapJudgeToModel(this.judge);

      const indexOfJudge = this.hearing.participants.findIndex(x => x.is_judge === true);
      if (indexOfJudge > -1) {
        this.hearing.participants.splice(indexOfJudge, 1);
      }
      this.hearing.participants.unshift(newJudge);
    }
  }

  saveJudge() {
    console.log(`judge email is = ${this.judge.email}`);
    if (this.judge.email === null) {
      console.log('not selected.. returning');
      this.isJudgeSelected = false;
      return;
    }
    if (this.assignJudgeForm.valid) {
      this.failedSubmission = false;
      this.assignJudgeForm.markAsPristine();
      this.hasSaved = true;
      this.hearingService.updateHearingRequest(this.hearing);

      if (this.editMode) {
        this.navigateToSummary();
      } else {
        this.router.navigate(['/add-participants']);
      }
    } else {
      this.failedSubmission = true;
    }
  }

  confirmCancelBooking() {
    if (this.editMode) {
      if (this.assignJudgeForm.dirty || this.assignJudgeForm.touched) {
        this.attemptingDiscardChanges = true;
      } else {
        this.navigateToSummary();
      }
    } else {
      this.attemptingCancellation = true;
    }
  }

  continueBooking() {
    this.attemptingCancellation = false;
    this.attemptingDiscardChanges = false;
  }

  cancelAssignJudge() {
    this.attemptingCancellation = false;
    this.assignJudgeForm.reset();
    this.hearingService.cancelRequest();
    this.router.navigate(['/dashboard']);
  }

  cancelChanges() {
    this.attemptingDiscardChanges = false;
    this.assignJudgeForm.reset();
    this.navigateToSummary();
  }

  hasChanges(): Observable<boolean> | boolean {
    if (this.assignJudgeForm.dirty) {
      this.confirmCancelBooking();
    }
    return this.assignJudgeForm.dirty;
  }

  goToDiv(fragment: string): void {
    window.document.getElementById(fragment).parentElement.parentElement.scrollIntoView();
  }

  private loadJudges() {
    if (this.availableJudges) { return; }
    this.judgeService.getJudges()
      .subscribe(
        (data: JudgeResponse[]) => {
          this.availableJudges = data.filter(x => x.first_name && x.last_name);
          const userResponse = new JudgeResponse();
          userResponse.display_name = 'Please Select';
          userResponse.email = null;
          this.availableJudges.unshift(userResponse);
        },
        error => console.error(error)
      );
  }
}
