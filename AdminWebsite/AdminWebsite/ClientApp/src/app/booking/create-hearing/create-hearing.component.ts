import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HearingTypeResponse, VideoSupplier } from '../../services/clients/api-client';
import { HearingModel } from '../../common/model/hearing.model';
import { CaseModel } from '../../common/model/case.model';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';
import { BookingService } from '../../services/booking.service';
import { ErrorService } from 'src/app/services/error.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Constants } from 'src/app/common/constants';
import { SanitizeInputText } from '../../common/formatters/sanitize-input-text';
import { Logger } from 'src/app/services/logger';
import { FeatureFlags, LaunchDarklyService } from '../../services/launch-darkly.service';
import { map, takeUntil } from 'rxjs/operators';
import { combineLatest, Subject } from 'rxjs';
import { ServiceIds } from '../models/supplier-override';

@Component({
    selector: 'app-create-hearing',
    templateUrl: './create-hearing.component.html',
    styleUrls: ['./create-hearing.component.scss']
})
export class CreateHearingComponent extends BookingBaseComponent implements OnInit, OnDestroy {
    attemptingCancellation: boolean;
    attemptingDiscardChanges = false;
    failedSubmission: boolean;
    hearing: HearingModel;
    availableHearingTypes: HearingTypeResponse[];
    availableCaseTypes: string[];
    selectedCaseType: string;
    filteredHearingTypes: HearingTypeResponse[] = [];
    hasSaved: boolean;
    isExistingHearing: boolean;
    destroyed$ = new Subject<void>();

    vodafoneToggle = false;
    supportedSupplierOverrides: ServiceIds = { serviceIds: [] };
    displayOverrideSupplier = false;
    supplierOptions = VideoSupplier;

    private multiDayEnhancementsEnabled: boolean;

    constructor(
        protected hearingService: VideoHearingsService,
        private fb: FormBuilder,
        protected router: Router,
        protected bookingService: BookingService,
        protected logger: Logger,
        private errorService: ErrorService,
        private launchDarklyService: LaunchDarklyService
    ) {
        super(bookingService, router, hearingService, logger);
        this.attemptingCancellation = false;
        this.availableCaseTypes = [];
    }

    ngOnInit() {
        this.launchDarklyService
            .getFlag<boolean>(FeatureFlags.multiDayBookingEnhancements)
            .pipe(takeUntil(this.destroyed$))
            .subscribe(flag => {
                this.multiDayEnhancementsEnabled = flag;
            });

        const vodafoneToggle$ = this.launchDarklyService.getFlag<boolean>(FeatureFlags.vodafone);
        const supplierOverridesToggle$ = this.launchDarklyService.getFlag<ServiceIds>(FeatureFlags.supplierOverrides, { serviceIds: [] });

        combineLatest([vodafoneToggle$, supplierOverridesToggle$]).subscribe(([vodafoneToggle, supplierOverrides]) => {
            this.vodafoneToggle = vodafoneToggle;
            this.supportedSupplierOverrides = supplierOverrides;
            if (this.form && !this.form.contains('supplier')) {
                this.form.addControl('supplier', this.fb.control(this.hearing?.supplier ?? this.retrieveDefaultSupplier()));
                if (this.isExistingHearingOrParticipantsAdded()) {
                    this.form.get('supplier').disable();
                }
            } else if (this.form && this.form.contains('supplier')) {
                this.form.removeControl('supplier');
                this.hearing.supplier = this.retrieveDefaultSupplier();
            }
        });

        this.failedSubmission = false;
        this.checkForExistingRequestOrCreateNew();
        this.initForm();
        this.retrieveHearingTypes();
        super.ngOnInit();
    }

    goToDiv(fragment: string): void {
        window.document.getElementById(fragment).parentElement.parentElement.scrollIntoView();
    }

    isExistingHearingOrParticipantsAdded(): boolean {
        return !!this.hearing && (!!this.isExistingHearing || this.hearing.participants.some(p => !p.is_judge));
    }

    private checkForExistingRequestOrCreateNew() {
        this.hearing = this.hearingService.getCurrentRequest();
        this.isExistingHearing = this.hearing?.hearing_id && this.hearing?.hearing_id?.length > 0;
        this.logger.debug(`${this.loggerPrefix} Checking for existing hearing.`);

        this.selectedCaseType = this.hearing.case_type;
        if (this.hearing.case_type) {
            this.selectedCaseType = this.hearing.case_type;
            return;
        } else {
            this.selectedCaseType = Constants.PleaseSelect;
        }

        if (!!this.hearing.case_type) {
            this.selectedCaseType = this.hearing.case_type;
            this.logger.debug(`${this.loggerPrefix} Updating selected case type to current hearing case type.`, {
                hearing: this.hearing.hearing_id
            });
            this.hasSaved = true;
        } else {
            this.selectedCaseType = Constants.PleaseSelect;
        }
    }

    private setHearingTypeForExistingHearing() {
        if (this.hasSaved && this.filteredHearingTypes.length > 0) {
            this.form.get('hearingType').setValue(this.hearing.hearing_type_id);
        }
    }

    private initForm() {
        let firstCase = this.hearing.cases[0];
        if (!firstCase) {
            firstCase = new CaseModel();
        }
        this.form = this.fb.group({
            caseName: [firstCase.name, [Validators.required, Validators.pattern(Constants.TextInputPattern), Validators.maxLength(255)]],
            caseNumber: [
                firstCase.number,
                [Validators.required, Validators.pattern(Constants.TextInputPattern), Validators.maxLength(255)]
            ],
            caseType: [this.selectedCaseType, [Validators.required, Validators.pattern('^((?!Please select).)*$')]],
            hearingType: [this.hearing.hearing_type_id, []]
        });

        if (this.isExistingHearingOrParticipantsAdded()) {
            ['caseType', 'hearingType'].forEach(k => {
                this.form.get(k).disable();
            });
        }
    }

    retrieveDefaultSupplier(): VideoSupplier {
        return this.vodafoneToggle ? VideoSupplier.Vodafone : VideoSupplier.Kinly;
    }

    get caseName() {
        return this.form.get('caseName');
    }
    get caseNumber() {
        return this.form.get('caseNumber');
    }
    get caseType() {
        return this.form.get('caseType');
    }
    get hearingType() {
        return this.form.get('hearingType');
    }

    get caseNameInvalid() {
        return this.caseName.invalid && (this.caseName.dirty || this.caseName.touched || this.failedSubmission);
    }

    get caseNumberInvalid() {
        return this.caseNumber.invalid && (this.caseNumber.dirty || this.caseNumber.touched || this.failedSubmission);
    }

    get caseTypeInvalid() {
        return this.caseType.invalid && (this.caseType.dirty || this.caseType.touched || this.failedSubmission);
    }

    get hearingTypeInvalid() {
        return this.hearingType.invalid && (this.hearingType.dirty || this.hearingType.touched || this.failedSubmission);
    }

    get canEditCaseName() {
        if (this.hearing.isMultiDayEdit) {
            return false;
        }
        if (this.hearing.isMultiDay && this.multiDayEnhancementsEnabled && !this.isFirstDayOfMultiDay()) {
            return false;
        }
        return true;
    }

    get canEditCaseNumber() {
        if (this.hearing.isMultiDayEdit && !this.isFirstDayOfMultiDay()) {
            return false;
        }
        if (this.hearing.isMultiDay && this.multiDayEnhancementsEnabled && !this.isFirstDayOfMultiDay()) {
            return false;
        }
        return true;
    }

    isFirstDayOfMultiDay(): boolean {
        const firstDay = this.hearing.hearingsInGroup[0];
        const isFirstDay = this.hearing.hearing_id === firstDay.hearing_id;
        return isFirstDay;
    }

    saveHearingDetails() {
        if (this.form.valid && this.caseType.value !== Constants.PleaseSelect) {
            this.logger.debug(`${this.loggerPrefix} Updating booking hearing details.`);
            this.failedSubmission = false;
            this.updateHearingRequest();
            this.form.markAsPristine();
            this.hasSaved = true;
            if (this.editMode) {
                this.logger.debug(`${this.loggerPrefix} In edit mode. Returning to summary page.`);
                this.router.navigate([PageUrls.Summary]);
            } else {
                this.logger.debug(`${this.loggerPrefix} Navigating to hearing schedule.`);
                this.router.navigate([PageUrls.HearingSchedule]);
            }
        } else {
            this.logger.debug(`${this.loggerPrefix} Failed to update booking hearing details. Form is not valid.`);
            this.failedSubmission = true;
        }
    }

    continueBooking() {
        this.logger.debug(`${this.loggerPrefix} Rejected cancellation. Continuing with booking.`);
        this.attemptingCancellation = false;
        this.attemptingDiscardChanges = false;
    }

    confirmCancelBooking() {
        this.logger.debug(`${this.loggerPrefix} Attempting to cancel booking.`);
        if (this.editMode) {
            this.cancelBookingInEditMode();
        } else {
            this.cancelBookingInCreateMode();
        }
    }

    cancelBooking() {
        this.logger.debug(`${this.loggerPrefix} Cancelling booking and returning to dashboard.`);
        this.attemptingCancellation = false;
        this.hearingService.cancelRequest();
        this.form.reset();
        this.router.navigate([PageUrls.Dashboard]);
    }

    cancelChanges() {
        this.logger.debug(`${this.loggerPrefix} Resetting changes. Returning to summary.`);
        this.attemptingDiscardChanges = false;
        this.form.reset();
        this.navigateToSummary();
    }

    private updateHearingRequest() {
        this.hearing.case_type = this.selectedCaseType;
        const hearingCase = new CaseModel();
        hearingCase.name = this.form.value.caseName;
        hearingCase.number = this.form.value.caseNumber;
        this.hearing.cases[0] = hearingCase;
        this.hearing.case_type_id = this.isExistingHearing ? this.hearing.case_type_id : this.form.getRawValue().caseType;
        this.hearing.hearing_type_id = this.isExistingHearing ? this.hearing.hearing_type_id : this.form.getRawValue().hearingType;
        const hearingType = this.availableHearingTypes.find(c => c.id === this.hearing.hearing_type_id);
        // hearing type will be null if editing an expired hearing type
        this.hearing.hearing_type_name = hearingType?.name ?? this.hearing.hearing_type_name;
        this.hearing.hearing_type_code = hearingType?.code ?? this.hearing.hearing_type_code;
        const hearingTypeGroup = this.availableHearingTypes.find(c => c.group === this.hearing.case_type);
        // hearing type group will be null if editing an expired case type
        this.hearing.case_type_service_id = hearingTypeGroup?.service_id ?? this.hearing.case_type_service_id;
        this.hearing.supplier = this.form.getRawValue().supplier ?? this.retrieveDefaultSupplier();
        this.hearingService.updateHearingRequest(this.hearing);
        this.logger.debug(`${this.loggerPrefix} Updated hearing request details`, { hearing: this.hearing });
    }

    private retrieveHearingTypes() {
        this.logger.debug(`${this.loggerPrefix} Retrieving hearing type`);
        this.hearingService.getHearingTypes().subscribe({
            next: (data: HearingTypeResponse[]) => {
                this.setupCaseTypeAndHearingTypes(data);
                this.filterHearingTypes();
                this.setHearingTypeForExistingHearing();
            },
            error: error => this.errorService.handleError(error)
        });
    }

    private setupCaseTypeAndHearingTypes(hearingTypes: HearingTypeResponse[]) {
        this.logger.debug(`${this.loggerPrefix} Setting up hearing types`, {
            hearingTypes: hearingTypes.length
        });

        this.caseType.valueChanges.subscribe(val => {
            this.selectedCaseType = val;
            this.logger.debug(`${this.loggerPrefix} Updating selected case type`, {
                caseType: this.selectedCaseType
            });
            const serviceId = hearingTypes.find(h => h.group === this.selectedCaseType)?.service_id;
            if (this.supportedSupplierOverrides.serviceIds.includes(serviceId)) {
                this.displayOverrideSupplier = true;
            }
            this.filterHearingTypes();
            this.displaySupplierOverrideIfSupported();
        });

        this.availableHearingTypes = hearingTypes;
        this.availableHearingTypes.sort(this.dynamicSort('name'));
        this.availableCaseTypes = this.availableHearingTypes
            .map(h => h.group)
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort((a, b) => a.localeCompare(b));

        if (this.availableCaseTypes.length === 1) {
            this.selectedCaseType = this.availableCaseTypes[0];
            this.form.get('caseType').setValue(this.selectedCaseType);
            this.logger.debug(`${this.loggerPrefix} Only one available case type. Setting case type`);
        } else {
            this.availableCaseTypes.unshift(Constants.PleaseSelect);
        }
        this.displaySupplierOverrideIfSupported();
    }

    private displaySupplierOverrideIfSupported() {
        if (!this.selectedCaseType) {
            return;
        }
        const serviceId = this.availableHearingTypes.find(h => h.group === this.selectedCaseType)?.service_id;
        if (serviceId && this.supportedSupplierOverrides.serviceIds.includes(serviceId)) {
            this.displayOverrideSupplier = true;
        } else {
            this.displayOverrideSupplier = false;
            this.form.get('supplier')?.setValue(this.retrieveDefaultSupplier(), { emitEvent: false });
        }
    }

    private filterHearingTypes() {
        this.filteredHearingTypes = [];
        if (this.selectedCaseType) {
            this.filteredHearingTypes = this.availableHearingTypes.filter(h => h.group === this.selectedCaseType);
        }
        this.logger.debug(`${this.loggerPrefix} Filtering hearing types for case type`, {
            caseType: this.selectedCaseType,
            hearingTypes: this.filteredHearingTypes.length
        });
        const pleaseSelect = new HearingTypeResponse();
        pleaseSelect.name = Constants.PleaseSelect;
        pleaseSelect.id = null;
        this.filteredHearingTypes.unshift(pleaseSelect);
        this.hearingType.setValue(null);
    }

    private cancelBookingInCreateMode() {
        if (this.form.dirty || this.form.touched) {
            this.logger.debug(`${this.loggerPrefix} New booking. Changes found. Confirm if changes should be discarded.`);
            this.attemptingCancellation = true;
        } else {
            this.logger.debug(`${this.loggerPrefix} New booking. No changes found. Cancelling booking.`);
            this.cancelBooking();
        }
    }

    private cancelBookingInEditMode() {
        if (this.form.dirty || this.form.touched) {
            this.logger.debug(`${this.loggerPrefix} In edit mode. Changes found. Confirm if changes should be discarded.`);
            this.attemptingDiscardChanges = true;
        } else {
            this.logger.debug(`${this.loggerPrefix} In edit mode. No changes. Returning to summary.`);
            this.router.navigate([PageUrls.Summary]);
        }
    }

    private dynamicSort(property) {
        let sortOrder = 1;
        if (property[0] === '-') {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a, b) {
            if (a[property] < b[property]) {
                return -1 * sortOrder;
            }
            const result = a[property] > b[property] ? 1 : 0;
            return result * sortOrder;
        };
    }

    caseNumberOnBlur() {
        const text = SanitizeInputText(this.caseNumber.value);
        this.caseNumber.setValue(text);
    }

    caseNameOnBlur() {
        const text = SanitizeInputText(this.caseName.value);
        this.caseName.setValue(text);
    }

    ngOnDestroy() {
        this.bookingService.removeEditMode();
        this.destroyed$.next();
        this.destroyed$.complete();
    }
}
