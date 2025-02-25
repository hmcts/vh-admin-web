import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Logger } from 'src/app/services/logger';
import { CaseModel } from '../../common/model/case.model';
import { CancelPopupComponent } from '../../popups/cancel-popup/cancel-popup.component';
import { DiscardConfirmPopupComponent } from '../../popups/discard-confirm-popup/discard-confirm-popup.component';
import { BookingService } from '../../services/booking.service';
import { ErrorService } from '../../services/error.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { SharedModule } from '../../shared/shared.module';
import { MockValues } from '../../testing/data/test-objects';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CreateHearingComponent } from './create-hearing.component';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';
import { By } from '@angular/platform-browser';
import { createMultiDayHearing } from 'src/app/testing/helpers/hearing.helpers';
import { VideoSupplier } from 'src/app/services/clients/api-client';
import { ServiceIds } from '../models/supplier-override';
import { ReferenceDataService } from 'src/app/services/reference-data.service';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { VHParticipant } from 'src/app/common/model/vh-participant';
import { HearingRoles } from 'src/app/common/model/hearing-roles.model';
import { ResponseTestData } from 'src/app/testing/data/response-test-data';
import { PageUrls } from 'src/app/shared/page-url.constants';

function initHearingRequest(): VHBooking {
    const newHearing = new VHBooking();
    newHearing.hearingVenueId = -1;
    newHearing.scheduledDuration = 0;
    return newHearing;
}

function initExistingHearingRequest(): VHBooking {
    const existingRequest = new VHBooking();
    existingRequest.hearingVenueId = 1;
    existingRequest.caseType = ResponseTestData.getCaseTypeModelTestData();

    return existingRequest;
}

let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let refDataServiceSpy: jasmine.SpyObj<ReferenceDataService>;
let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
let routerSpy: jasmine.SpyObj<Router>;
const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);
let bookingServiceSpy: jasmine.SpyObj<BookingService>;
const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
const defaultOverrideValue: ServiceIds = { serviceIds: [] };

describe('CreateHearingComponent with multiple Services', () => {
    let component: CreateHearingComponent;
    let fixture: ComponentFixture<CreateHearingComponent>;
    let caseNameControl: AbstractControl;
    let caseNumberControl: AbstractControl;
    let caseTypeControl: AbstractControl;

    const newHearing = initHearingRequest();

    beforeEach(() => {
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.specialMeasures).and.returnValue(of(false));
        launchDarklyServiceSpy.getFlag
            .withArgs(FeatureFlags.supplierOverrides, defaultOverrideValue)
            .and.returnValue(of(defaultOverrideValue));

        refDataServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService', ['getCaseTypes']);

        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
            'getCurrentRequest',
            'updateHearingRequest',
            'setBookingHasChanged',
            'unsetBookingHasChanged'
        ]);

        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);
        refDataServiceSpy.getCaseTypes.and.returnValue(of(MockValues.CaseTypesList));
        bookingServiceSpy = jasmine.createSpyObj('BookingSErvice', ['isEditMode', 'resetEditMode', 'removeEditMode']);

        TestBed.configureTestingModule({
            imports: [SharedModule, RouterTestingModule],
            providers: [
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: ReferenceDataService, useValue: refDataServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ErrorService, useValue: errorService },
                { provide: BookingService, useValue: bookingServiceSpy },
                { provide: Logger, useValue: loggerSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                { provide: BreadcrumbComponent, useClass: BreadcrumbStubComponent }
            ],
            declarations: [CreateHearingComponent, BreadcrumbStubComponent, CancelPopupComponent, DiscardConfirmPopupComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(CreateHearingComponent);
        component = fixture.componentInstance;
        component.ngOnInit();
        fixture.detectChanges();

        caseNameControl = component.form.controls['caseName'];
        caseNumberControl = component.form.controls['caseNumber'];
        caseTypeControl = component.form.controls['caseType'];
    });

    it('should not set Service when multiple items returned', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
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
    it('should validate Service', () => {
        const caseTypeValue = 'Tax';
        expect(caseNumberControl.valid).toBeFalsy();
        caseTypeControl.setValue(caseTypeValue);
        expect(component.selectedCaseType).toBe(caseTypeValue);
        expect(caseTypeControl.valid).toBeTruthy();
    });

    describe('saveHearingDetails when form is valid and fully populated', () => {
        beforeEach(() => {
            caseNumberControl.setValue('12345');
            caseNameControl.setValue('Case Name');
            caseTypeControl.setValue('Tax');
        });

        it('should navigate to summary when in edit mode', () => {
            component.editMode = true;
            component.saveHearingDetails();
            expect(routerSpy.navigate).toHaveBeenCalledWith([PageUrls.Summary]);
        });

        it('should navigate to hearing schedule when not in edit mode', () => {
            component.editMode = false;
            component.saveHearingDetails();
            expect(routerSpy.navigate).toHaveBeenCalledWith([PageUrls.HearingSchedule]);
        });
    });

    describe('supplier overrides', () => {
        beforeEach(() => {
            launchDarklyServiceSpy.getFlag
                .withArgs(FeatureFlags.supplierOverrides, defaultOverrideValue)
                .and.returnValue(of({ serviceIds: ['ZZY1'] }));

            component.ngOnInit();
            fixture.detectChanges();
        });

        it('should map supplier override', () => {
            expect(component.supportedSupplierOverrides).toEqual({ serviceIds: ['ZZY1'] });
        });

        it('should display supplier override when selected Service is in the override list', () => {
            const caseTypeValue = 'Generic';
            caseTypeControl.setValue(caseTypeValue);
            expect(component.selectedCaseType).toBe(caseTypeValue);
            expect(component.displayOverrideSupplier).toBeTrue();
        });

        it('should not display supplier override when selected Service is not in the override list', () => {
            const caseTypeValue = 'Tax';
            caseTypeControl.setValue(caseTypeValue);
            expect(component.selectedCaseType).toBe(caseTypeValue);
            expect(component.displayOverrideSupplier).toBeFalse();
        });

        describe('retrieveDefaultSupplier', () => {
            it('should return Vodafone', () => {
                const defaultSupplier = component.retrieveDefaultSupplier();
                expect(defaultSupplier).toBe(VideoSupplier.Vodafone);
            });
        });
    });
});

describe('CreateHearingComponent with single Service', () => {
    let component: CreateHearingComponent;
    let fixture: ComponentFixture<CreateHearingComponent>;
    const newHearing = initHearingRequest();

    beforeEach(() => {
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.specialMeasures).and.returnValue(of(false));
        launchDarklyServiceSpy.getFlag
            .withArgs(FeatureFlags.supplierOverrides, defaultOverrideValue)
            .and.returnValue(of(defaultOverrideValue));

        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
            'getCurrentRequest',
            'updateHearingRequest',
            'cancelRequest',
            'setBookingHasChanged',
            'unsetBookingHasChanged'
        ]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        bookingServiceSpy = jasmine.createSpyObj('BookingSErvice', ['isEditMode', 'resetEditMode', 'removeEditMode']);
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);
        refDataServiceSpy.getCaseTypes.and.returnValue(of(MockValues.CaseTypesSingle));

        TestBed.configureTestingModule({
            declarations: [CreateHearingComponent, BreadcrumbComponent, CancelPopupComponent, DiscardConfirmPopupComponent],
            imports: [ReactiveFormsModule, RouterTestingModule],
            providers: [
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: ReferenceDataService, useValue: refDataServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ErrorService, useValue: errorService },
                { provide: BookingService, useValue: bookingServiceSpy },
                { provide: Logger, useValue: loggerSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                { provide: BreadcrumbComponent, useClass: BreadcrumbStubComponent },
                provideHttpClient(withInterceptorsFromDi())
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CreateHearingComponent);
        component = fixture.componentInstance;
        component.ngOnInit();
        fixture.detectChanges();
    });

    it('should set Service when single item returned', fakeAsync(() => {
        refDataServiceSpy.getCaseTypes.and.returnValue(of(MockValues.CaseTypesSingle));
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        expect(component.availableCaseTypes.length).toBe(1);
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
    let caseNameElement: HTMLInputElement;
    let caseNumberElement: HTMLInputElement;
    const existingRequest = initExistingHearingRequest();

    beforeEach(() => {
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.specialMeasures).and.returnValue(of(false));
        launchDarklyServiceSpy.getFlag
            .withArgs(FeatureFlags.supplierOverrides, defaultOverrideValue)
            .and.returnValue(of(defaultOverrideValue));

        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
            'getCurrentRequest',
            'updateHearingRequest',
            'cancelRequest',
            'setBookingHasChanged',
            'unsetBookingHasChanged'
        ]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        bookingServiceSpy = jasmine.createSpyObj('BookingSErvice', ['isEditMode', 'resetEditMode', 'removeEditMode']);

        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(existingRequest);
        refDataServiceSpy.getCaseTypes.and.returnValue(of(MockValues.CaseTypesList));

        TestBed.configureTestingModule({
            declarations: [CreateHearingComponent, BreadcrumbComponent, CancelPopupComponent, DiscardConfirmPopupComponent],
            imports: [ReactiveFormsModule, RouterTestingModule],
            providers: [
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: ReferenceDataService, useValue: refDataServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ErrorService, useValue: errorService },
                { provide: BookingService, useValue: bookingServiceSpy },
                { provide: Logger, useValue: loggerSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                { provide: BreadcrumbComponent, useClass: BreadcrumbStubComponent },
                provideHttpClient(withInterceptorsFromDi())
            ]
        }).compileComponents();

        const existingCase = new CaseModel();
        existingCase.name = 'Captain America Vs. The World';
        existingCase.number = '1234';
        existingRequest.case = existingCase;

        const newRequestKey = 'bh-newRequest';
        const jsonRequest = JSON.stringify(existingRequest);
        sessionStorage.setItem(newRequestKey, jsonRequest);

        fixture = TestBed.createComponent(CreateHearingComponent);
        component = fixture.componentInstance;
        component.ngOnInit();
        fixture.detectChanges();

        caseNameElement = fixture.debugElement.query(By.css('#caseName')).nativeElement;
        caseNumberElement = fixture.debugElement.query(By.css('#caseNumber')).nativeElement;
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    it('should repopulate form with existing request', fakeAsync(() => {
        expect(component.caseNumber.value).toBe(existingRequest.case.number);
        expect(component.caseName.value).toBe(existingRequest.case.name);
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
            new VHParticipant({ isExistPerson: true, interpretation_language: undefined }),
            new VHParticipant({ hearingRoleName: HearingRoles.JUDGE, isExistPerson: true, interpretation_language: undefined })
        ];
        expect(component.isExistingHearingOrParticipantsAdded()).toBe(true);
    });
    it('should return false if participants have not been added', () => {
        component.hearing.participants = [];
        expect(component.isExistingHearingOrParticipantsAdded()).toBe(false);
        component.hearing.participants = [
            new VHParticipant({ hearingRoleName: HearingRoles.JUDGE, isExistPerson: true, interpretation_language: undefined })
        ];
        expect(component.isExistingHearingOrParticipantsAdded()).toBe(false);
    });
    it('should return false if hearing is undefined', () => {
        component.hearing = null;
        expect(component.isExistingHearingOrParticipantsAdded()).toBe(false);
    });
    describe('editing a single day in a multi-day hearing', () => {
        const multiDayHearing = createMultiDayHearing(existingRequest);

        describe('hearing is first day in multi-day', () => {
            beforeEach(() => {
                const hearing = Object.assign({}, multiDayHearing.hearingsInGroup[0]);
                hearing.isMultiDayEdit = false;
                videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
            });
            it('should enable editing of case name when multi-day hearing enhancements are enabled', fakeAsync(() => {
                launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(true));
                component.ngOnInit();
                tick();
                fixture.detectChanges();
                expect(caseNameElement.disabled).toBeFalse();
            }));
            it('should enable editing of case name when multi-day hearing enhancements are disabled', fakeAsync(() => {
                launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));
                component.ngOnInit();
                tick();
                fixture.detectChanges();
                expect(caseNameElement.disabled).toBeFalse();
            }));
            it('should enable editing of case number', () => {
                component.ngOnInit();
                fixture.detectChanges();
                expect(caseNumberElement.disabled).toBeFalse();
            });
        });

        describe('hearing is not first day in multi-day', () => {
            beforeEach(() => {
                const hearing = Object.assign({}, multiDayHearing.hearingsInGroup[1]);
                hearing.isMultiDayEdit = false;
                videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
            });
            it('should disable editing of case name when multi-day hearing enhancements are enabled', fakeAsync(() => {
                launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(true));
                component.ngOnInit();
                tick();
                fixture.detectChanges();
                expect(caseNameElement.disabled).toBeTrue();
            }));
            it('should enable editing of case name when multi-day hearing enhancements are disabled', fakeAsync(() => {
                launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));
                component.ngOnInit();
                tick();
                fixture.detectChanges();
                expect(caseNameElement.disabled).toBeFalse();
            }));
            it('should disable editing of case number when multi-day hearing enhancements are enabled', fakeAsync(() => {
                launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(true));
                component.ngOnInit();
                tick();
                fixture.detectChanges();
                expect(caseNumberElement.disabled).toBeTrue();
            }));

            it('should enable editing of case number when multi-day hearing enhancements are disabled', fakeAsync(() => {
                launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));
                component.ngOnInit();
                tick();
                fixture.detectChanges();
                expect(caseNumberElement.disabled).toBeFalse();
            }));
        });
    });
    describe('editing multiple days in a multi-day hearing', () => {
        const multiDayHearing = createMultiDayHearing(existingRequest);

        beforeEach(() => {
            const hearing = Object.assign({}, multiDayHearing.hearingsInGroup[0]);
            hearing.isMultiDayEdit = true;
            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
        });

        it('should disable editing of case name', () => {
            component.ngOnInit();
            fixture.detectChanges();
            expect(caseNameElement.disabled).toBeTrue();
        });

        describe('hearing is first day in multi-day', () => {
            beforeEach(() => {
                const hearing = Object.assign({}, multiDayHearing.hearingsInGroup[0]);
                hearing.isMultiDayEdit = true;
                videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
            });
            it('should enable editing of case number', () => {
                component.ngOnInit();
                fixture.detectChanges();
                expect(caseNumberElement.disabled).toBeFalse();
            });
        });

        describe('hearing is not first day in multi-day', () => {
            beforeEach(() => {
                const hearing = Object.assign({}, multiDayHearing.hearingsInGroup[1]);
                hearing.isMultiDayEdit = true;
                videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
            });
            it('should disable editing of case number', () => {
                component.ngOnInit();
                fixture.detectChanges();
                expect(caseNumberElement.disabled).toBeTrue();
            });
        });
    });
    afterAll(() => {
        component.ngOnDestroy();
    });
});
