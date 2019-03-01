import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { CancelPopupComponent } from 'src/app/popups/cancel-popup/cancel-popup.component';
import { SharedModule } from 'src/app/shared/shared.module';

import { CaseRequest, HearingRequest, ICaseRequest } from '../../services/clients/api-client';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { MockValues } from '../../testing/data/test-objects';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CreateHearingComponent } from './create-hearing.component';
import { ErrorService } from 'src/app/services/error.service';

function initHearingRequest(): HearingRequest {
  const initRequest = {
    cases: [],
    feeds: [],
    hearing_type_id: -1,
    hearing_medium_id: -1,
    court_id: -1,
    scheduled_duration: 0,
  };
  const newHearing = new HearingRequest(initRequest);
  return newHearing;
}

function initExistingHearingRequest(): HearingRequest {
    const existingRequest = new HearingRequest();
    existingRequest.hearing_type_id = 2;
    existingRequest.hearing_medium_id = 1;
    existingRequest.feeds = [];
    existingRequest.cases = [];
    return existingRequest;
}

describe('CreateHearingComponent with multiple case types', () => {
  let component: CreateHearingComponent;
  let fixture: ComponentFixture<CreateHearingComponent>;
  let caseNameControl: AbstractControl;
  let caseNumberControl: AbstractControl;
  let caseTypeControl: AbstractControl;
  let hearingMethodControl: AbstractControl;
  let hearingTypeControl: AbstractControl;
  const newHearing = initHearingRequest();

  let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
  let routerSpy: jasmine.SpyObj<Router>;
  const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);

  beforeEach(() => {
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
      ['getHearingMediums', 'getHearingTypes', 'getCurrentRequest', 'updateHearingRequest']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);
    videoHearingsServiceSpy.getHearingMediums.and.returnValue(of(MockValues.HearingMediums));
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      providers: [
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ErrorService, useValue: errorService },
      ],
      declarations: [CreateHearingComponent, BreadcrumbComponent, CancelPopupComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CreateHearingComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();

    caseNameControl = component.hearingForm.controls['caseName'];
    hearingMethodControl = component.hearingForm.controls['hearingMethod'];
    caseNumberControl = component.hearingForm.controls['caseNumber'];
    caseTypeControl = component.hearingForm.controls['caseType'];
    hearingTypeControl = component.hearingForm.controls['hearingType'];

  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.caseNumber.value).toBeNull();
    expect(component.caseName.value).toBeNull();
    expect(component.caseType.value).toBe('Please Select');
    expect(component.hearingType.value).toBe(-1);
    expect(component.hearingMethod.value).toBe(-1);
  });

  it('should not set case type when multiple items returned', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.availableHearingTypes.length).toBe(3);
  });

  it('should fail validation when form is empty', () => {
    expect(component.hearingForm.valid).toBeFalsy();
  });

  it('should display error summary when save invalid form', () => {
    expect(component.failedSubmission).toBeFalsy();
    component.saveHearingDetails();
    expect(component.failedSubmission).toBeTruthy();
  });

  it('should validate case name', () => {
    expect(caseNameControl.valid).toBeFalsy();
    caseNameControl.setValue('Captain America vs The World');
    expect(caseNameControl.valid).toBeTruthy();
  });

  it('should validate case number', () => {
    expect(caseNumberControl.valid).toBeFalsy();
    caseNumberControl.setValue('12345');
    expect(caseNumberControl.valid).toBeTruthy();
  });

  it('should validate case type', () => {
    const caseTypeValue = 'Tax';
    expect(caseNumberControl.valid).toBeFalsy();
    caseTypeControl.setValue(caseTypeValue);
    expect(component.selectedCaseType).toBe(caseTypeValue);
    expect(caseTypeControl.valid).toBeTruthy();
  });

  it('should validate hearing type', () => {
    expect(hearingTypeControl.valid).toBeFalsy();
    hearingTypeControl.setValue(2);
    expect(hearingTypeControl.valid).toBeTruthy();
  });

  it('should validate hearing medium', () => {
    expect(hearingMethodControl.valid).toBeFalsy();
    hearingMethodControl.setValue(1);
    expect(hearingMethodControl.valid).toBeTruthy();
  });

  it('should update hearing request when form is valid', () => {
    expect(component.hearingForm.valid).toBeFalsy();
    caseNameControl.setValue('Captain America vs The World');
    caseNumberControl.setValue('12345');
    caseTypeControl.setValue('Tax');
    hearingTypeControl.setValue(2);
    hearingMethodControl.setValue(3);
    expect(component.hearingForm.valid).toBeTruthy();
    component.saveHearingDetails();
    expect(component.hearing.hearing_medium_id).toBe(3);
    expect(component.hearing.hearing_type_id).toBe(2);
    expect(component.hearing.cases.length).toBe(1);
  });
});

describe('CreateHearingComponent with single case type', () => {
  let component: CreateHearingComponent;
  let fixture: ComponentFixture<CreateHearingComponent>;
  const newHearing = initHearingRequest();

  let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
  let routerSpy: jasmine.SpyObj<Router>;
  const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);

  beforeEach(() => {
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
      ['getHearingMediums', 'getHearingTypes', 'getCurrentRequest', 'updateHearingRequest']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);
    videoHearingsServiceSpy.getHearingMediums.and.returnValue(of(MockValues.HearingMediums));
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesSingle));

    TestBed.configureTestingModule({
      imports: [HttpClientModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ErrorService, useValue: errorService },
      ],
      declarations: [CreateHearingComponent, BreadcrumbComponent, CancelPopupComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CreateHearingComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();
  });

  it('should set case type when single item returned', fakeAsync(() => {
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesSingle));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(component.availableHearingTypes.length).toBe(1);
    expect(component.selectedCaseType).toBeDefined();
  }));
});

describe('CreateHearingComponent with existing request in session', () => {
  let component: CreateHearingComponent;
  let fixture: ComponentFixture<CreateHearingComponent>;
  const existingRequest = initExistingHearingRequest();

  let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
  let routerSpy: jasmine.SpyObj<Router>;
  const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);

  beforeEach(() => {
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
      ['getHearingMediums', 'getHearingTypes', 'getCurrentRequest', 'updateHearingRequest']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
    videoHearingsServiceSpy.getHearingMediums.and.returnValue(of(MockValues.HearingMediums));
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));

    TestBed.configureTestingModule({
      imports: [HttpClientModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ErrorService, useValue: errorService },
      ],
      declarations: [CreateHearingComponent, BreadcrumbComponent, CancelPopupComponent]
    }).compileComponents();

    const iCaseRequest: ICaseRequest = { name: 'Captain America Vs. The World', number: '1234' };
    const existingCase = new CaseRequest(iCaseRequest);
    existingRequest.cases.push(existingCase);

    const newRequestKey = 'bh-newRequest';
    const jsonRequest = existingCase.toJSON();
    sessionStorage.setItem(newRequestKey, jsonRequest);

    fixture = TestBed.createComponent(CreateHearingComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should prepopulate form with existing request', fakeAsync(() => {
    expect(component.caseNumber.value).toBe(existingRequest.cases[0].number);
    expect(component.caseName.value).toBe(existingRequest.cases[0].name);
    expect(component.hearingType.value).toBe(existingRequest.hearing_type_id);
    expect(component.hearingMethod.value).toBe(existingRequest.hearing_medium_id);
  }));
});
