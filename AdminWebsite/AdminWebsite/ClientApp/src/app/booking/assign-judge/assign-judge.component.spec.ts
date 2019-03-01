import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CancelPopupComponent } from 'src/app/popups/cancel-popup/cancel-popup.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';

import { HearingRequest, FeedRequest, ParticipantRequest } from '../../services/clients/api-client';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { AssignJudgeComponent } from './assign-judge.component';
import { of } from 'rxjs';
import { MockValues } from '../../testing/data/test-objects';
import { JudgeDataService } from '../services/judge-data.service';
import { ParticipantsListComponent } from '../participants-list/participants-list.component';

function initHearingRequest(): HearingRequest {
  const initRequest = {
    cases: [],
    feeds: [
      new FeedRequest({
        location: 'Judge',
        participants: [
          new ParticipantRequest({
            display_name: 'display name1',
            email: 'test1@TestBed.com',
            first_name: 'first',
            last_name: 'last',
            role: 'Judge',
            title: 'Mr.'
          }),
          new ParticipantRequest({
            display_name: 'display name2',
            email: 'test2@TestBed.com',
            first_name: 'first2',
            last_name: 'last2',
            role: 'Judge',
            title: 'Mr.'
          })
        ]
      }),
      new FeedRequest({
        location: 'Professional',
        participants: [
          new ParticipantRequest({
            display_name: 'display name3',
            email: 'test3@TestBed.com',
            first_name: 'first3',
            last_name: 'last3',
            role: 'Judge',
            title: 'Mr.'
          }),
          new ParticipantRequest({
            display_name: 'display name3',
            email: 'test3@TestBed.com',
            first_name: 'first3',
            last_name: 'last3',
            role: 'Judge',
            title: 'Mr.'
          })
        ]
      }),
    ],
    hearing_type_id: -1,
    hearing_medium_id: -1,
    court_id: -1,
    scheduled_date_time: null,
    scheduled_duration: 0,
  };
  const newHearing = new HearingRequest(initRequest);
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

