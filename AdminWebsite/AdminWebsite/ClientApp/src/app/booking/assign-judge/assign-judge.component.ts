import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CanDeactiveComponent } from 'src/app/common/guards/changes.guard';
import { ParticipantDetailsResponse } from '../../services/clients/api-client';
import { FeedModel, HearingModel } from '../../common/model/hearing.model';
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
  participants: ParticipantModel[] = [];
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
    const find_judge = this.getAllParticipants().find(x => x.role === 'Judge');

    if (!find_judge) {
      this.judge = new ParticipantDetailsResponse({
        id: null
      });
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

    this.participants = this.getAllParticipants();
  }

  mapJudge(judge: ParticipantModel): ParticipantDetailsResponse {
    return new ParticipantDetailsResponse({
      id: null,
      title: judge.title,
      first_name: judge.first_name,
      middle_name: judge.middle_names,
      last_name: judge.last_name,
      display_name: judge.display_name,
      email: judge.email,
      role: judge.role,
      phone: judge.phone
    });
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
    this.judge.title = 'Judge';
    this.judge.role = 'Judge';
    this.judge.id = selectedJudge.id;

    let judgeFeed = this.getExistingFeedWithJudge();
    if (judgeFeed) {
      judgeFeed.participants = [];
    } else {
      judgeFeed = new FeedModel('Judge');
      this.hearing.feeds.push(judgeFeed);
    }
    judgeFeed.participants.push(this.judge);
    this.hearingService.updateHearingRequest(this.hearing);
    this.participants = this.getAllParticipants();
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

  private getAllParticipants(): ParticipantModel[] {
    let participants: ParticipantModel[] = [];
    this.hearing.feeds.forEach(x => {
      if (x.participants && x.participants.length >= 1) {
        participants = participants.concat(x.participants);
      }
    });
    return participants;
  }

  private getExistingFeedWithJudge(): FeedModel {
    return this.hearing.feeds.find(x => x.participants.filter(y => y.role === 'Judge').length > 0);
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
