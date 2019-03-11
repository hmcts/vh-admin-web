import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CancelPopupComponent } from 'src/app/popups/cancel-popup/cancel-popup.component';
import { RemovePopupComponent } from '../../popups/remove-popup/remove-popup.component';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';
import { BookingEditStubComponent } from '../../testing/stubs/booking-edit-stub';
import { ReferenceDataService } from '../../services/reference-data.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { MockValues } from '../../testing/data/test-objects';
import { SummaryComponent } from './summary.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HearingModel} from '../../common/model/hearing.model';
import { CaseModel } from '../../common/model/case.model';
import { ParticipantsListStubComponent } from '../../testing/stubs/participant-list-stub';

function initExistingHearingRequest(): HearingModel {
  const today = new Date();
  today.setHours(14, 30);

  const newCaseRequest = new CaseModel();
  newCaseRequest.name = 'Mr. Test User vs HMRC';
  newCaseRequest.number = 'TX/12345/2018';

  const existingRequest = new HearingModel();
  existingRequest.hearing_type_id = 2;
  existingRequest.cases.push(newCaseRequest);
  existingRequest.hearing_venue_id = 2;
  existingRequest.scheduled_date_time = today;
  existingRequest.scheduled_duration = 80;
  existingRequest.other_information = 'some notes';
  existingRequest.court_room = '123W';
  return existingRequest;
}

function initBadHearingRequest(): HearingModel {
  const today = new Date();
  today.setHours(14, 30);

  const newCaseRequest = new CaseModel();
  newCaseRequest.name = 'Mr. Test User vs HMRC';
  newCaseRequest.number = 'TX/12345/2018';

  const existingRequest = new HearingModel();
  existingRequest.hearing_type_id = 2;
  existingRequest.cases.push(newCaseRequest);
  existingRequest.hearing_venue_id = 2;
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

  beforeEach(async(() => {
    initExistingHearingRequest();
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'url']);

    referenceDataServiceServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService',
      ['getCourts']);
    referenceDataServiceServiceSpy.getCourts.and.returnValue(of(MockValues.Courts));
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
      ['getHearingMediums', 'getHearingTypes', 'getCurrentRequest', 'updateHearingRequest', 'saveHearing']);

    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));

    TestBed.configureTestingModule({
      providers: [
        { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: routerSpy }
      ],
      declarations: [SummaryComponent, BreadcrumbStubComponent,
        CancelPopupComponent, ParticipantsListStubComponent, BookingEditStubComponent,
      RemovePopupComponent],
      imports: [RouterTestingModule],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display summary data from existing hearing', () => {
    expect(component.caseNumber).toEqual(existingRequest.cases[0].number);
    expect(component.caseName).toEqual(existingRequest.cases[0].name);
    expect(component.otherInformation).toEqual(existingRequest.other_information);
    const hearingstring = MockValues.HearingTypesList.find(c => c.id === existingRequest.hearing_type_id).name;
    expect(component.caseHearingType).toEqual(hearingstring);
    expect(component.hearingDate).toEqual(existingRequest.scheduled_date_time);
    const courtString = MockValues.Courts.find(c => c.id === existingRequest.hearing_venue_id);
    expect(component.courtRoomAddress).toEqual(`${courtString.name} 123W`);
  });
});

describe('SummaryComponent  with invalid request', () => {
  let component: SummaryComponent;
  let fixture: ComponentFixture<SummaryComponent>;

  let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
  let referenceDataServiceServiceSpy: jasmine.SpyObj<ReferenceDataService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async(() => {
    initExistingHearingRequest();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    referenceDataServiceServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService',
      ['getCourts']);
    referenceDataServiceServiceSpy.getCourts.and.returnValue(of(MockValues.Courts));
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
      ['getHearingMediums', 'getHearingTypes', 'getCurrentRequest', 'updateHearingRequest', 'saveHearing', 'getOtherInformation']);

    const existingRequest = initBadHearingRequest();
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
    videoHearingsServiceSpy.saveHearing.and.callFake(() => {
      return throwError(new Error('Fake error'));
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: ReferenceDataService, useValue: referenceDataServiceServiceSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: routerSpy }
      ],
      imports: [RouterTestingModule],
      declarations: [SummaryComponent, BreadcrumbStubComponent, CancelPopupComponent,
        ParticipantsListStubComponent, BookingEditStubComponent, RemovePopupComponent]
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
