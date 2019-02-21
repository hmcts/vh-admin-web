import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CanDeactiveComponent } from 'src/app/common/guards/changes.guard';
import { FeedRequest, HearingRequest, ParticipantRequest, ParticipantDetailsResponse } from '../../services/clients/api-client';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { Constants } from 'src/app/common/constants';
import { JudgeDataService } from 'src/app/booking/services/judge-data.service';

@Component({
  selector: 'app-assign-judge',
  templateUrl: './assign-judge.component.html',
  styleUrls: ['./assign-judge.component.css']
})

export class AssignJudgeComponent implements OnInit, CanDeactiveComponent {

  hearing: HearingRequest;
  judge: ParticipantDetailsResponse;
  assignJudgeForm: FormGroup;
  failedSubmission: boolean;
  attemptingCancellation: boolean;
  hasSaved: boolean;
  canNavigate = true;

  constants = Constants;
  participants: ParticipantRequest[] = [];
  availableJudges: ParticipantDetailsResponse[];
  isJudgeSelected = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private hearingService: VideoHearingsService,
    private judgeService: JudgeDataService) { }

  ngOnInit() {
    this.failedSubmission = false;
    this.checkForExistingRequest();
    this.loadJudges();
    this.initForm();
  }

  private checkForExistingRequest() {
    this.hearing = this.hearingService.getCurrentRequest();
  }

  private initForm() {
    this.judge = this.getAllParticipants().find(x => x.role === 'Judge');
    if (!this.judge) {
      this.judge = new ParticipantDetailsResponse({
        id: null
      });
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
      judgeFeed = new FeedRequest({
        location: 'Judge',
        participants: []
      });
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
      this.router.navigate(['/add-participants']);
    } else {
      this.failedSubmission = true;
    }
  }

  confirmCancelBooking() {
    this.attemptingCancellation = true;
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

  private getAllParticipants(): ParticipantRequest[] {
    let participants: ParticipantRequest[] = [];
    this.hearing.feeds.forEach(x => {
      if (x.participants && x.participants.length >= 1) {
        participants = participants.concat(x.participants);
      }
    });
    return participants;
  }

  private getExistingFeedWithJudge(): FeedRequest {
    return this.hearing.feeds.find(x => x.participants.filter(y => y.role === 'Judge').length > 0);
  }

  private loadJudges() {
    if (this.availableJudges) { return; }
    console.debug('No judges found, retrieving list from AD');
    this.judgeService.getJudges()
      .subscribe(
        (data: ParticipantDetailsResponse[]) => {
          console.debug(data);
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
