import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CancelPopupComponent } from 'src/app/popups/cancel-popup/cancel-popup.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';

import { VideoHearingsService } from '../../services/video-hearings.service';
import { AssignJudgeComponent } from './assign-judge.component';
import { of } from 'rxjs';
import { MockValues } from '../../testing/data/test-objects';
import { JudgeDataService } from '../services/judge-data.service';
import { ParticipantsListComponent } from '../participants-list/participants-list.component';
import { HearingModel, FeedModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';

function initHearingRequest(): HearingModel {

  const f1 = new FeedModel('Judge');

  const participants: ParticipantModel[] = [];
  const p1 = new ParticipantModel();
  p1.display_name = 'display name1';
  p1.email = 'test1@TestBed.com';
  p1.first_name = 'first';
  p1.last_name = 'last';
  p1.is_judge = true;
  p1.title = 'Mr.';

  const p2 = new ParticipantModel();
  p2.display_name = 'display name2';
  p2.email = 'test2@TestBed.com';
  p2.first_name = 'first2';
  p2.last_name = 'last2';
  p2.is_judge = true;
  p2.title = 'Mr.';

  participants.push(p1);
  participants.push(p2);

  const f2 = new FeedModel('Professional');

  const participants1: ParticipantModel[] = [];
  const p3 = new ParticipantModel();
  p3.display_name = 'display name3';
  p3.email = 'test3@TestBed.com';
  p3.first_name = 'first3';
  p3.last_name = 'last3';
  p3.is_judge = true;
  p3.title = 'Mr.';

  const p4 = new ParticipantModel();
  p4.display_name = 'display name3';
  p4.email = 'test3@TestBed.com';
  p4.first_name = 'first3';
  p4.last_name = 'last3';
  p4.is_judge = true;
  p4.title = 'Mr.';

  participants.push(p1);
  participants.push(p2);
  participants.push(p3);
  participants.push(p4);

  const newHearing = new HearingModel();
  newHearing.cases = [];
  newHearing.feeds = [];
  newHearing.feeds.push(f1);
  newHearing.feeds.push(f2);

  newHearing.hearing_type_id = -1;
  newHearing.court_id = -1;
  newHearing.scheduled_date_time = null;
  newHearing.scheduled_duration = 0;

  return newHearing;
}

let component: AssignJudgeComponent;
let fixture: ComponentFixture<AssignJudgeComponent>;

let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let judgeDataServiceSpy: jasmine.SpyObj<JudgeDataService>;

describe('AssignJudgeComponent', () => {
  beforeEach(async(() => {
    const newHearing = initHearingRequest();

    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
      ['getHearingMediums', 'getHearingTypes', 'getCurrentRequest', 'updateHearingRequest']);
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);

    judgeDataServiceSpy = jasmine.createSpyObj<JudgeDataService>(['JudgeDataService', 'getJudges']);
    judgeDataServiceSpy.getJudges.and.returnValue(of(MockValues.Judges));

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      providers: [
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: JudgeDataService, useValue: judgeDataServiceSpy },
      ],
      declarations: [AssignJudgeComponent, BreadcrumbStubComponent, CancelPopupComponent, ParticipantsListComponent, ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AssignJudgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.ngOnInit();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fail validation if a judge is not selected', () => {
    console.log(component);
    component.saveJudge();
    expect(component.assignJudgeForm.valid).toBeFalsy();
  });
});

