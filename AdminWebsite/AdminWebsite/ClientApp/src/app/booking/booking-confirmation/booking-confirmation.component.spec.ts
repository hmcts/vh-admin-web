import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingConfirmationComponent } from './booking-confirmation.component';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { of } from 'rxjs';
import { CaseModel } from 'src/app/common/model/case.model';
import { LongDatetimePipe } from '../../../app/shared/directives/date-time.pipe';
import { Logger } from '../../services/logger';
import { Route } from '@angular/compiler/src/core';

function initHearingRequest(): HearingModel {

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

  const cases: CaseModel[] = [];
  const newcase = new CaseModel();
  newcase.number = 'TX/12345/2019';
  newcase.name = 'BBC vs HMRC';
  newcase.isLeadCase = false;
  cases.push(newcase);

  const newHearing = new HearingModel();
  newHearing.cases = cases;
  newHearing.participants = participants;

  const today = new Date();
  today.setHours(14, 30);

  newHearing.hearing_type_id = -1;
  newHearing.hearing_venue_id = -1;
  newHearing.scheduled_date_time = today;
  newHearing.scheduled_duration = 0;

  return newHearing;
}
describe('BookingConfirmationComponent', () => {
  let component: BookingConfirmationComponent;
  let fixture: ComponentFixture<BookingConfirmationComponent>;
  let routerSpy: jasmine.SpyObj<Route>;
  let loggerSpy: jasmine.SpyObj<Logger>;
  let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
  const newHearing = initHearingRequest();

  beforeEach(async(() => {
    loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
      ['getHearingMediums', 'getHearingTypes', 'getCurrentRequest', 'updateHearingRequest', 'getHearingById']);
    videoHearingsServiceSpy.getHearingById.and.returnValue(of(newHearing));

    TestBed.configureTestingModule({
      declarations: [BookingConfirmationComponent, LongDatetimePipe],
      imports: [RouterTestingModule],
      providers: [
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Logger, useValue: loggerSpy },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookingConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the new hearing information', () => {
    component.ngOnInit();
    component.retrieveSavedHearing();
    expect(component.caseNumber).toEqual(newHearing.cases[0].number);
    expect(component.caseName).toEqual(newHearing.cases[0].name);
    expect(component.hearingDate).toEqual(newHearing.scheduled_date_time);
  });
});
