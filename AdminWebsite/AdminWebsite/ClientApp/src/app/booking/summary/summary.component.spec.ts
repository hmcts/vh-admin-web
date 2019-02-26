import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CancelPopupComponent } from 'src/app/popups/cancel-popup/cancel-popup.component';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';

import { CaseRequest, HearingRequest } from '../../services/clients/api-client';
import { ReferenceDataService } from '../../services/reference-data.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { MockValues } from '../../testing/data/test-objects';
import { ParticipantsListComponent } from '../participants-list/participants-list.component';
import { SummaryComponent } from './summary.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ErrorService } from 'src/app/services/error.service';

function initExistingHearingRequest(): HearingRequest {
  const today = new Date();
  today.setHours(14, 30);

  const newCaseRequest = new CaseRequest();
  newCaseRequest.name = 'Mr. Test User vs HMRC';
  newCaseRequest.number = 'TX/12345/2018';

  const existingRequest = new HearingRequest();
  existingRequest.hearing_type_id = 2;
  existingRequest.hearing_medium_id = 1;
  existingRequest.feeds = [];
  existingRequest.cases = [];
  existingRequest.cases.push(newCaseRequest);
  existingRequest.court_id = 2;
  existingRequest.scheduled_date_time = today;
  existingRequest.scheduled_duration = 80;
  return existingRequest;
}

function initBadHearingRequest(): HearingRequest {
  const today = new Date();
  today.setHours(14, 30);

  const newCaseRequest = new CaseRequest();
  newCaseRequest.name = 'Mr. Test User vs HMRC';
  newCaseRequest.number = 'TX/12345/2018';

  const existingRequest = new HearingRequest();
  existingRequest.hearing_type_id = 2;
  existingRequest.hearing_medium_id = 1;
  existingRequest.feeds = [];
  existingRequest.cases = [];
  existingRequest.cases.push(newCaseRequest);
  existingRequest.court_id = 2;
  existingRequest.scheduled_date_time = today;
  existingRequest.scheduled_duration = 80;
  return existingRequest;
}

describe('SummaryComponent with valid request', () => {
  let component: SummaryComponent;
  let fixture: ComponentFixture<SummaryComponent>;

  const existingRequest = initExistingHearingRequest();

  let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
  let referenceDataServiceServiceSpy: jasmine.SpyObj<ReferenceDataService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);

  beforeEach(async(() => {
    initExistingHearingRequest();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    referenceDataServiceServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService',
      ['getCourts']);
    referenceDataServiceServiceSpy.getCourts.and.returnValue(of(MockValues.Courts));
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
      ['getHearingMediums', 'getHearingTypes', 'getCurrentRequest', 'updateHearingRequest', 'saveHearing']);

    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
    videoHearingsServiceSpy.getHearingMediums.and.returnValue(of(MockValues.HearingMediums));
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));

    TestBed.configureTestingModule({
      providers: [
        { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ErrorService, useValue: errorService },
      ],
      declarations: [SummaryComponent, BreadcrumbStubComponent, CancelPopupComponent, ParticipantsListComponent],
      imports: [RouterTestingModule],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display sumary data from exisitng hearing', () => {
    expect(component.caseNumber).toEqual(existingRequest.cases[0].number);
    expect(component.caseName).toEqual(existingRequest.cases[0].name);
    const hearingstring = MockValues.HearingTypesList.find(c => c.id === existingRequest.hearing_type_id).name;
    expect(component.caseHearingType).toEqual(hearingstring);
    expect(component.hearingDate).toEqual(existingRequest.scheduled_date_time);
    const courtString = MockValues.Courts.find(c => c.id === existingRequest.court_id);
    expect(component.courtRoomAddress).toEqual(courtString.address + ', ' + courtString.room);
    const durationText = 'listed for ' + existingRequest.scheduled_duration + ' minutes';
  });
});

describe('SummaryComponent  with invalid request', () => {
  let component: SummaryComponent;
  let fixture: ComponentFixture<SummaryComponent>;

  let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
  let referenceDataServiceServiceSpy: jasmine.SpyObj<ReferenceDataService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);

  beforeEach(async(() => {
    initExistingHearingRequest();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    referenceDataServiceServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService',
      ['getCourts']);
    referenceDataServiceServiceSpy.getCourts.and.returnValue(of(MockValues.Courts));
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
      ['getHearingMediums', 'getHearingTypes', 'getCurrentRequest', 'updateHearingRequest', 'saveHearing']);

    const existingRequest = initBadHearingRequest();
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
    videoHearingsServiceSpy.getHearingMediums.and.returnValue(of(MockValues.HearingMediums));
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
    videoHearingsServiceSpy.saveHearing.and.callFake(() => {
      return throwError(new Error('Fake error'));
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ErrorService, useValue: errorService },
      ],
      imports: [RouterTestingModule],
      declarations: [SummaryComponent, BreadcrumbStubComponent, CancelPopupComponent, ParticipantsListComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display save failed message', () => {
    component.bookHearing();
    expect(component.saveFailed).toBeTruthy();
  });
});
