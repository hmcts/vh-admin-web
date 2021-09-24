import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { FeatureFlagService } from 'src/app/services/feature-flag.service';
import { Logger } from 'src/app/services/logger';
import { CaseModel } from '../../common/model/case.model';
import { HearingModel } from '../../common/model/hearing.model';
import { CancelPopupComponent } from '../../popups/cancel-popup/cancel-popup.component';
import { DiscardConfirmPopupComponent } from '../../popups/discard-confirm-popup/discard-confirm-popup.component';
import { BookingService } from '../../services/booking.service';
import { ErrorService } from '../../services/error.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { SharedModule } from '../../shared/shared.module';
import { MockValues } from '../../testing/data/test-objects';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CreateHearingComponent } from './create-hearing.component';

function initHearingRequest(): HearingModel {
    const newHearing = new HearingModel();
    newHearing.hearing_type_id = -1;
    newHearing.hearing_venue_id = -1;
    newHearing.scheduled_duration = 0;
    return newHearing;
}

function initExistingHearingRequest(): HearingModel {
    const existingRequest = new HearingModel();
    existingRequest.hearing_type_id = 2;
    existingRequest.hearing_venue_id = 1;
    existingRequest.questionnaire_not_required = false;
    existingRequest.case_type = 'Generic';

    return existingRequest;
}

let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let routerSpy: jasmine.SpyObj<Router>;
const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);
let bookingServiceSpy: jasmine.SpyObj<BookingService>;
const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
let featureFlagServiceSpy: jasmine.SpyObj<FeatureFlagService>;

describe('CreateHearingComponent with multiple case types', () => {
    let component: CreateHearingComponent;
    let fixture: ComponentFixture<CreateHearingComponent>;
    let caseNameControl: AbstractControl;
    let caseNumberControl: AbstractControl;
    let caseTypeControl: AbstractControl;
    let hearingTypeControl: AbstractControl;

    const newHearing = initHearingRequest();

    beforeEach(() => {
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
            'getHearingTypes',
            'getCurrentRequest',
            'updateHearingRequest',
            'setBookingHasChanged'
        ]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        featureFlagServiceSpy = jasmine.createSpyObj<FeatureFlagService>('FeatureToggleService', ['getFeatureFlagByName']);
        featureFlagServiceSpy.getFeatureFlagByName.and.returnValue(of(true));

        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);
        videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
        bookingServiceSpy = jasmine.createSpyObj('BookingSErvice', ['isEditMode', 'resetEditMode', 'removeEditMode']);

        TestBed.configureTestingModule({
            imports: [SharedModule, RouterTestingModule],
            providers: [
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: FeatureFlagService, useValue: featureFlagServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ErrorService, useValue: errorService },
                { provide: BookingService, useValue: bookingServiceSpy },
                { provide: Logger, useValue: loggerSpy }
            ],
            declarations: [CreateHearingComponent, BreadcrumbComponent, CancelPopupComponent, DiscardConfirmPopupComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(CreateHearingComponent);
        component = fixture.componentInstance;
        component.ngOnInit();
        fixture.detectChanges();

        caseNameControl = component.form.controls['caseName'];
        caseNumberControl = component.form.controls['caseNumber'];
        caseTypeControl = component.form.controls['caseType'];
        hearingTypeControl = component.form.controls['hearingType'];
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
        expect(component.caseNumber.value).toBeNull();
        expect(component.caseName.value).toBeNull();
        expect(component.caseType.value).toBe('Please select');
        expect(component.hearingType.value).toBe(null);
    });

    it('should not set case type when multiple items returned', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
        expect(component.availableHearingTypes.length).toBe(3);
    });

    it('should fail validation when form is empty', () => {
        expect(component.form.valid).toBeFalsy();
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
    it('should validate case name and returns false for not permitted characters', () => {
        expect(caseNameControl.valid).toBeFalsy();
        caseNameControl.setValue('%Captain America vs The World');
        component.failedSubmission = true;
        expect(component.caseNameInvalid).toBeTruthy();
    });
    it('should validate case number', () => {
        expect(caseNumberControl.valid).toBeFalsy();
        caseNumberControl.setValue('12345');
        expect(caseNumberControl.valid).toBeTruthy();
    });
    it('should validate case number and returns false for not permitted characters', () => {
        expect(caseNumberControl.valid).toBeFalsy();
        caseNumberControl.setValue('%1234');
        component.failedSubmission = true;
        expect(component.caseNumberInvalid).toBeTruthy();
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

    it('should set hearing type to please select when case type changes', () => {
        const caseTypeValue = 'Generic';
        caseTypeControl.setValue(caseTypeValue);
        expect(component.selectedCaseType).toBe(caseTypeValue);
        expect(caseTypeControl.valid).toBeTruthy();
        expect(component.hearingType.value).toBe(null);
        expect(hearingTypeControl.valid).toBeFalsy();
    });

    it('should update hearing request when form is valid', () => {
        expect(component.form.valid).toBeFalsy();

        caseNameControl.setValue('Captain America vs The World');
        caseNumberControl.setValue('12345');
        caseTypeControl.setValue('Tax');
        hearingTypeControl.setValue(2);

        expect(component.form.valid).toBeTruthy();
        component.saveHearingDetails();
        expect(component.hearing.hearing_type_id).toBe(2);
        const hearingTypeName = MockValues.HearingTypesList.find(c => c.id === component.hearing.hearing_type_id).name;
        expect(component.hearing.hearing_type_name).toBe(hearingTypeName);
        expect(component.hearing.cases.length).toBe(1);
        expect(component.hearing.questionnaire_not_required).toBeFalsy();
    });
});

describe('CreateHearingComponent with single case type', () => {
    let component: CreateHearingComponent;
    let fixture: ComponentFixture<CreateHearingComponent>;
    const newHearing = initHearingRequest();

    beforeEach(() => {
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
            'getHearingTypes',
            'getCurrentRequest',
            'updateHearingRequest',
            'cancelRequest',
            'setBookingHasChanged'
        ]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        bookingServiceSpy = jasmine.createSpyObj('BookingSErvice', ['isEditMode', 'resetEditMode', 'removeEditMode']);
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);
        videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesSingle));
        featureFlagServiceSpy = jasmine.createSpyObj<FeatureFlagService>('FeatureToggleService', ['getFeatureFlagByName']);
        featureFlagServiceSpy.getFeatureFlagByName.and.returnValue(of(true));

        TestBed.configureTestingModule({
            imports: [HttpClientModule, ReactiveFormsModule, RouterTestingModule],
            providers: [
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: FeatureFlagService, useValue: featureFlagServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ErrorService, useValue: errorService },
                { provide: BookingService, useValue: bookingServiceSpy },
                { provide: Logger, useValue: loggerSpy }
            ],
            declarations: [CreateHearingComponent, BreadcrumbComponent, CancelPopupComponent, DiscardConfirmPopupComponent]
        }).compileComponents();

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

    it('should show cancel booking confirmation pop up', () => {
        component.editMode = false;
        component.form.markAsDirty();
        fixture.detectChanges();
        component.confirmCancelBooking();
        expect(component.attemptingCancellation).toBeTruthy();
    });
});

describe('CreateHearingComponent with existing request in session', () => {
    let component: CreateHearingComponent;
    let fixture: ComponentFixture<CreateHearingComponent>;
    const existingRequest = initExistingHearingRequest();
    existingRequest.hearing_type_name = 'Automated Test';

    beforeEach(() => {
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
            'getHearingTypes',
            'getCurrentRequest',
            'updateHearingRequest',
            'cancelRequest',
            'setBookingHasChanged'
        ]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        bookingServiceSpy = jasmine.createSpyObj('BookingSErvice', ['isEditMode', 'resetEditMode', 'removeEditMode']);

        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
        videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
        featureFlagServiceSpy = jasmine.createSpyObj<FeatureFlagService>('FeatureToggleService', ['getFeatureFlagByName']);
        featureFlagServiceSpy.getFeatureFlagByName.and.returnValue(of(true));

        TestBed.configureTestingModule({
            imports: [HttpClientModule, ReactiveFormsModule, RouterTestingModule],
            providers: [
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: FeatureFlagService, useValue: featureFlagServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ErrorService, useValue: errorService },
                { provide: BookingService, useValue: bookingServiceSpy },
                { provide: Logger, useValue: loggerSpy }
            ],
            declarations: [CreateHearingComponent, BreadcrumbComponent, CancelPopupComponent, DiscardConfirmPopupComponent]
        }).compileComponents();

        const existingCase = new CaseModel();
        existingCase.name = 'Captain America Vs. The World';
        existingCase.number = '1234';
        existingRequest.cases.push(existingCase);

        const newRequestKey = 'bh-newRequest';
        const jsonRequest = JSON.stringify(existingRequest);
        sessionStorage.setItem(newRequestKey, jsonRequest);

        fixture = TestBed.createComponent(CreateHearingComponent);
        component = fixture.componentInstance;
        component.ngOnInit();
        fixture.detectChanges();
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    it('should repopulate form with existing request', fakeAsync(() => {
        expect(component.caseNumber.value).toBe(existingRequest.cases[0].number);
        expect(component.caseName.value).toBe(existingRequest.cases[0].name);
        expect(component.hearingType.value).toBe(existingRequest.hearing_type_id);
    }));

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

    it('should cancel booking, hide pop up and navigate to dashboard', () => {
        component.attemptingCancellation = true;
        fixture.detectChanges();
        component.cancelBooking();
        expect(component.attemptingCancellation).toBeFalsy();
        expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('should cancel current changes, hide pop up and navigate to summary', () => {
        component.attemptingDiscardChanges = true;
        fixture.detectChanges();
        component.cancelChanges();
        expect(component.attemptingDiscardChanges).toBeFalsy();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });
    it('should sanitize text for case number', () => {
        component.caseNumber.setValue('<script>text</script>');
        component.caseNumberOnBlur();
        fixture.detectChanges();
        expect(component.caseNumber.value).toBe('text');
    });
    it('should sanitize text for case name', () => {
        component.caseName.setValue('<script>text</script>');
        component.caseNameOnBlur();
        fixture.detectChanges();
        expect(component.caseName.value).toBe('text');
    });
    it('should return true if participants have been added', () => {
        component.hearing.participants = [
            { is_judge: false, is_exist_person: true },
            { is_judge: true, is_exist_person: true }
        ];
        expect(component.isExistingHearingOrParticipantsAdded()).toBe(true);
    });
    it('should return false if participants have not been added', () => {
        component.hearing.participants = [];
        expect(component.isExistingHearingOrParticipantsAdded()).toBe(false);
        component.hearing.participants = [{ is_judge: true, is_exist_person: true }];
        expect(component.isExistingHearingOrParticipantsAdded()).toBe(false);
    });
    it('should return false if hearing is undefined', () => {
        component.hearing = null;
        expect(component.isExistingHearingOrParticipantsAdded()).toBe(false);
    });
    it('should unsibscribe subcription on destroy', () => {
        component.ngOnDestroy();
    });
});
