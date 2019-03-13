import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CanDeactiveComponent } from 'src/app/common/guards/changes.guard';
import { ParticipantDetailsResponse } from '../../services/clients/api-client';
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
  judge: ParticipantDetailsResponse;
  assignJudgeForm: FormGroup;
  failedSubmission: boolean;
  attemptingCancellation: boolean;
  hasSaved: boolean;
  canNavigate = true;

  constants = Constants;
  availableJudges: ParticipantDetailsResponse[];
  isJudgeSelected = true;

  constructor(
    private fb: FormBuilder,
    protected router: Router,
    private hearingService: VideoHearingsService,
    private judgeService: JudgeDataService,
    protected bookingService: BookingService) {
    super(bookingService, router);
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
      this.judge = new ParticipantDetailsResponse({ id: null });
    } else {
      this.judge = this.mapJudge(find_judge);
    }
    this.assignJudgeForm = this.fb.group({
      judgeName: [this.judge.id, Validators.required],
    });

    this.judgeName.valueChanges.subscribe(judgeUserId => {
      this.addJudge(judgeUserId);
      this.isJudgeSelected = judgeUserId !== null;
    });
  }

  mapJudge(judge: ParticipantModel): ParticipantDetailsResponse {
    return new ParticipantDetailsResponse({
      id: judge.id,
      title: judge.title,
      first_name: judge.first_name,
      middle_name: judge.middle_names,
      last_name: judge.last_name,
      display_name: judge.display_name,
      email: judge.email,
      role: 'Judge',
      phone: judge.phone
    });
  }

  mapJudgeToModel(judge: ParticipantDetailsResponse): ParticipantModel {
    const newParticipant = new ParticipantModel();
    newParticipant.title = judge.title;
    newParticipant.first_name = judge.first_name;
    newParticipant.middle_names = judge.middle_name;
    newParticipant.last_name = judge.last_name;
    newParticipant.display_name = judge.display_name;
    newParticipant.email = judge.email;
    newParticipant.is_judge = true;
    newParticipant.phone = judge.phone;
    newParticipant.id = judge.id;
    newParticipant.username = judge.email;
    newParticipant.case_role_name = '5';
    newParticipant.hearing_role_name = '5';
    return newParticipant;
  }

  get judgeName() { return this.assignJudgeForm.get('judgeName'); }

  get judgeNameInvalid() {
    return this.judgeName.invalid && (this.judgeName.dirty || this.judgeName.touched || this.failedSubmission);
  }

  public addJudge(judgeId: string) {
    const selectedJudge = this.availableJudges.find(j => j.id === judgeId);
    this.judge.first_name = selectedJudge.first_name;
    this.judge.last_name = selectedJudge.last_name;
    this.judge.email = selectedJudge.email;
    this.judge.display_name = selectedJudge.display_name;
    this.judge.title = 'mr.';
    this.judge.role = 'Judge';
    this.judge.id = selectedJudge.id;

    const newJudge = this.mapJudgeToModel(this.judge);

    const indexOfJudge = this.hearing.participants.findIndex(x => x.is_judge === true);
    if (indexOfJudge > -1) {
      this.hearing.participants.splice(indexOfJudge, 1);
    }
    this.hearing.participants.unshift(newJudge);
    this.hearingService.updateHearingRequest(this.hearing);
  }

  saveJudge() {
    if (this.judge.id === null) {
      this.isJudgeSelected = false;
      return;
    }
    if (this.assignJudgeForm.valid) {
      this.failedSubmission = false;
      this.assignJudgeForm.markAsPristine();
      this.hasSaved = true;
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
      this.navigateToSummary();
    } else {
      this.attemptingCancellation = true;
    }
  }

  continueBooking() {
    this.attemptingCancellation = false;
  }

  cancelAssignJudge() {
    this.attemptingCancellation = false;
    this.assignJudgeForm.reset();
    this.hearingService.cancelRequest();
    this.router.navigate(['/dashboard']);
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
        (data: ParticipantDetailsResponse[]) => {
          this.availableJudges = data.filter(x => x.first_name && x.last_name);
          const userResponse = new ParticipantDetailsResponse();
          userResponse.display_name = 'Please Select';
          userResponse.id = null;
          this.availableJudges.unshift(userResponse);
        },
        error => console.error(error)
      );
  }
}
