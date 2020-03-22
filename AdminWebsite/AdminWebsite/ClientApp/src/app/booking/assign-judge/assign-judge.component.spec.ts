import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CancelPopupComponent } from '../../popups/cancel-popup/cancel-popup.component';
import { DiscardConfirmPopupComponent } from '../../popups/discard-confirm-popup/discard-confirm-popup.component';
import { SharedModule } from '../../shared/shared.module';
import { BreadcrumbStubComponent } from '../../testing/stubs/breadcrumb-stub';
import { Router } from '@angular/router';

import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingService } from '../../services/booking.service';
import { AssignJudgeComponent } from './assign-judge.component';
import { of, Subscription } from 'rxjs';
import { MockValues } from '../../testing/data/test-objects';
import { JudgeDataService } from '../services/judge-data.service';
import { ParticipantsListStubComponent } from '../../testing/stubs/participant-list-stub';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { By } from '@angular/platform-browser';
import { Constants } from 'src/app/common/constants';
import { Logger } from '../../services/logger';
import { JudgeResponse } from '../../services/clients/api-client';

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
  p2.is_judge = false;
  p2.title = 'Mr.';

  participants.push(p1);
  participants.push(p2);

  const newHearing = new HearingModel();
  newHearing.cases = [];
  newHearing.participants = participants;

  newHearing.hearing_type_id = -1;
  newHearing.hearing_venue_id = -1;
  newHearing.scheduled_date_time = null;
  newHearing.scheduled_duration = 0;

  return newHearing;
}

let component: AssignJudgeComponent;
let fixture: ComponentFixture<AssignJudgeComponent>;

let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let judgeDataServiceSpy: jasmine.SpyObj<JudgeDataService>;
let routerSpy: jasmine.SpyObj<Router>;
let bookingServiseSpy: jasmine.SpyObj<BookingService>;
let loggerSpy: jasmine.SpyObj<Logger>;

describe('AssignJudgeComponent', () => {

  beforeEach(async(() => {
    const newHearing = initHearingRequest();
    loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error']);

    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
      ['getHearingTypes', 'getCurrentRequest',
        'updateHearingRequest', 'cancelRequest', 'setBookingHasChanged']);
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);

    bookingServiseSpy = jasmine.createSpyObj<BookingService>('BookingService', ['resetEditMode', 'isEditMode']);

    judgeDataServiceSpy = jasmine.createSpyObj<JudgeDataService>(['JudgeDataService', 'getJudges']);
    judgeDataServiceSpy.getJudges.and.returnValue(of(MockValues.Judges));

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      providers: [
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: JudgeDataService, useValue: judgeDataServiceSpy },
        {
          provide: Router, useValue: {
            url: '/summary',
            navigate: jasmine.createSpy('navigate')
          }
        },
        { provide: BookingService, useValue: bookingServiseSpy },
        { provide: Logger, useValue: loggerSpy },
      ],
      declarations: [AssignJudgeComponent, BreadcrumbStubComponent,
        CancelPopupComponent, ParticipantsListStubComponent, DiscardConfirmPopupComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AssignJudgeComponent);
    routerSpy = TestBed.get(Router);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.ngOnInit();
  }));

  it('should fail validation if a judge is not selected', () => {
    component.cancelAssignJudge();
    component.saveJudge();
    expect(component.form.valid).toBeFalsy();
  });

  it('is valid and has updated selected judge after selecting judge in dropdown', () => {
    const dropDown = fixture.debugElement.query(By.css('#judgeName')).nativeElement;
    dropDown.value = dropDown.options[2].value;
    dropDown.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.judge.email).toBe('John2.Doe@hearings.reform.hmcts.net');
    expect(component.form.valid).toBeTruthy();
  });
  it('should initialize form and create judgeDisplayName control', () => {
    component.ngOnInit();
    expect(component.judgeDisplayName).toBeTruthy();
    expect(component.judgeDisplayName.updateOn).toBe('blur');
  });
  it('judge display name field validity required', () => {
    let errors = {};
    component.form.controls['judgeDisplayName'].setValue('');
    const judge_display_name = component.form.controls['judgeDisplayName'];
    errors = judge_display_name.errors || {};
    expect(errors['required']).toBeTruthy();
  });
  it('judge display name field validity pattern', () => {
    let errors = {};
    component.form.controls['judgeDisplayName'].setValue('%');
    const judge_display_name = component.form.controls['judgeDisplayName'];
    errors = judge_display_name.errors || {};
    expect(errors['pattern']).toBeTruthy();
  });
  it('should fail validation if a judge display name is not entered', () => {
    component.ngOnInit();
    expect(component.judgeDisplayName).toBeTruthy();
    expect(component.judgeDisplayName.validator).toBeTruthy();
    component.judgeDisplayName.setValue('');
    expect(component.form.valid).toBeFalsy();

  });
  it('should succeeded validation if a judge display name is entered', () => {
    component.ngOnInit();
    component.judgeDisplayName.setValue('judge name');
    expect(component.judgeDisplayNameInvalid).toBeFalsy();
  });
  it('should not succeeded validation if a judge display name' +
    'is entered with not allowed characters', () => {
      component.ngOnInit();
      component.judgeDisplayName.setValue('%');
      component.failedSubmission = true;
      expect(component.judgeDisplayNameInvalid).toBeTruthy();
    });
  it('should return judgeDisplayNameInvalid is false if form is valid', () => {
    component.ngOnInit();
    component.judgeDisplayName.setValue('a');
    component.judgeDisplayName.markAsUntouched();
    component.judgeDisplayName.markAsPristine();
    component.failedSubmission = false;
    expect(component.judgeDisplayNameInvalid).toBeFalsy();
  });

  it('should get current booking and judge details', () => {
    component.ngOnInit();
    expect(component.failedSubmission).toBeFalsy();
    expect(videoHearingsServiceSpy.getCurrentRequest).toHaveBeenCalled();
    expect(component.canNavigate).toBeTruthy();
    expect(component.judge.first_name).toBe('first');
    expect(component.judge.display_name).toBe('display name1');
    expect(component.judge.email).toBe('test1@TestBed.com');
    expect(component.judge.last_name).toBe('last');
  });
  it('should get available judges', () => {
    component.ngOnInit();
    expect(component.availableJudges.length).toBeGreaterThan(1);
    expect(component.availableJudges[0].email).toBe(Constants.PleaseSelect);
    expect(component.availableJudges[0].display_name).toBe('');

  });
  it('should hide cancel and discard pop up confirmation', () => {
    component.attemptingCancellation = true;
    component.attemptingDiscardChanges = true;
    fixture.detectChanges();
    component.continueBooking();
    expect(component.attemptingCancellation).toBeFalsy();
    expect(component.attemptingDiscardChanges).toBeFalsy();
  });
  it('should show discard pop up confirmation', () => {
    component.editMode = true;
    component.form.markAsDirty();
    fixture.detectChanges();
    component.confirmCancelBooking();
    expect(component.attemptingDiscardChanges).toBeTruthy();
  });
  it('should navigate to summary page if no changes', () => {
    component.editMode = true;
    component.form.markAsPristine();
    fixture.detectChanges();
    component.confirmCancelBooking();
    expect(routerSpy.navigate).toHaveBeenCalled();
  });
  it('should show cancel booking confirmation pop up', () => {
    component.editMode = false;
    fixture.detectChanges();
    component.confirmCancelBooking();
    expect(component.attemptingCancellation).toBeTruthy();
  });
  it('should cancel booking, hide pop up and navigate to dashboard', () => {
    fixture.detectChanges();
    component.cancelAssignJudge();
    expect(component.attemptingCancellation).toBeFalsy();
    expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalled();
  });
  it('should cancel current changes, hide pop up and navigate to summary', () => {
    fixture.detectChanges();
    component.cancelChanges();
    expect(component.attemptingDiscardChanges).toBeFalsy();
    expect(routerSpy.navigate).toHaveBeenCalled();
  });
  it('should check if the judge display name was entered and return true', () => {
    component.judge.display_name = 'New Name Set';
    const result = component.isJudgeDisplayNameSet();
    expect(result).toBeTruthy();
  });
  it('should check if the judge display name was entered and return false', () => {
    component.judge.display_name = 'John Doe';
    const result = component.isJudgeDisplayNameSet();
    expect(result).toBeFalsy();
  });
  it('should add judge with display name was entered', () => {
    component.judge.display_name = 'New Name Set';
    component.hearing = new HearingModel();
    component.hearing.participants = [];
    component.availableJudges = [new JudgeResponse({ display_name: 'New Name Set', email: 'email@email.com' })];
    component.addJudge('email@email.com');
    expect(component.hearing.participants.length).toBeGreaterThan(0);
  });
  it('should sanitize display name of the judge if it was entered', () => {
    component.judgeDisplayName.setValue('<script>text</script>');
    component.changeDisplayName();
    expect(component.judgeDisplayName.value).toBe('text');
  });
  it('should change display name of the judge if it was selected', () => {
    component.judge.display_name = 'John Dall';
    component.changeDisplayName();
    expect(component.hearing.participants[0].display_name).toBe('John Dall');
  });
  it('should not save judge if courtroom account is null', () => {
    component.judge.email = null;
    component.saveJudge();
    expect(component.isJudgeSelected).toBeFalsy();
  });
  it('should not save judge if courtroom account is not selected', () => {
    component.judge.email = Constants.PleaseSelect;
    component.saveJudge();
    expect(component.isJudgeSelected).toBeFalsy();
  });
  it('should save judge if courtroom account is selected and form is valid', () => {
    const dropDown = fixture.debugElement.query(By.css('#judgeName')).nativeElement;
    dropDown.value = dropDown.options[2].value;
    dropDown.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.form.valid).toBeTruthy();

    component.saveJudge();
    expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
  });
  it('should log error message if no judges to load', () => {
    component.onErrorLoadJudges(new Error());
    expect(loggerSpy.error).toHaveBeenCalled();
  });
  it('should unsubscribe all subcriptions on destroy component', () => {
    component.ngOnDestroy();

    expect(component.$subscriptions[0].closed).toBeTruthy();
    expect(component.$subscriptions[1].closed).toBeTruthy();
  });
});

