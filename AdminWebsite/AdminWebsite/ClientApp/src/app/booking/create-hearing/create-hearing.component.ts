import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CaseTypeResponse, VideoSupplier } from '../../services/clients/api-client';
import { VHBooking } from 'src/app/common/model/vh-booking';
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
import { takeUntil } from 'rxjs/operators';
import { combineLatest, Subject } from 'rxjs';
import { ServiceIds } from '../models/supplier-override';
import { ReferenceDataService } from 'src/app/services/reference-data.service';
import { CaseTypeModel } from 'src/app/common/model/case-type.model';

@Component({
    selector: 'app-create-hearing',
    templateUrl: './create-hearing.component.html',
    styleUrls: ['./create-hearing.component.scss']
})
export class CreateHearingComponent extends BookingBaseComponent implements OnInit, OnDestroy {
    attemptingCancellation: boolean;
    attemptingDiscardChanges = false;
    failedSubmission: boolean;
    hearing: VHBooking;
    availableCaseTypes: CaseTypeModel[];
    selectedCaseType: string;
    selectedCaseTypeServiceId: string;
    hasSaved: boolean;
    isExistingHearing: boolean;
    destroyed$ = new Subject<void>();

    supportedSupplierOverrides: ServiceIds = { serviceIds: [] };
    displayOverrideSupplier = false;
    supplierOptions = VideoSupplier;

    private multiDayEnhancementsEnabled: boolean;

    constructor(
        protected hearingService: VideoHearingsService,
        private readonly fb: FormBuilder,
        protected router: Router,
        protected bookingService: BookingService,
        protected logger: Logger,
        private readonly errorService: ErrorService,
        private readonly launchDarklyService: LaunchDarklyService,
        private readonly referenceDataService: ReferenceDataService
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

        const supplierOverridesToggle$ = this.launchDarklyService.getFlag<ServiceIds>(FeatureFlags.supplierOverrides, { serviceIds: [] });

        combineLatest([supplierOverridesToggle$]).subscribe(([supplierOverrides]) => {
            this.supportedSupplierOverrides = supplierOverrides;
            if (this.form && !this.form.contains('supplier')) {
                this.form.addControl('supplier', this.fb.control(this.hearing?.supplier ?? this.retrieveDefaultSupplier()));
                if (this.isExistingHearingOrParticipantsAdded()) {
                    this.form.get('supplier').disable();
                }
            } else if (this.form?.contains('supplier')) {
                this.form.removeControl('supplier');
                this.hearing.supplier = this.retrieveDefaultSupplier();
            }
        });

        this.failedSubmission = false;
        this.checkForExistingRequestOrCreateNew();
        this.initForm();
        this.retrieveCaseTypes();
        super.ngOnInit();
    }

    goToDiv(fragment: string): void {
        window.document.getElementById(fragment).parentElement.parentElement.scrollIntoView();
    }

    isExistingHearingOrParticipantsAdded(): boolean {
        return !!this.hearing && (!!this.isExistingHearing || this.hearing.participants.some(p => !p.isJudge));
    }

    private checkForExistingRequestOrCreateNew() {
        this.hearing = this.hearingService.getCurrentRequest();
        this.isExistingHearing = this.hearing?.hearingId && this.hearing?.hearingId?.length > 0;
        this.logger.debug(`${this.loggerPrefix} Checking for existing hearing.`);

        this.selectedCaseType = this.hearing.caseType?.name;
        this.selectedCaseTypeServiceId = this.hearing.caseType?.serviceId;
        if (this.hearing.caseType) {
            this.selectedCaseType = this.hearing.caseType.name;
        } else {
            this.selectedCaseType = Constants.PleaseSelect;
        }
    }

    private initForm() {
        let firstCase = this.hearing.case;
        if (!firstCase) {
            firstCase = new CaseModel();
        }
        this.form = this.fb.group({
            caseName: [firstCase.name, [Validators.required, Validators.pattern(Constants.TextInputPattern), Validators.maxLength(255)]],
            caseNumber: [
                firstCase.number,
                [Validators.required, Validators.pattern(Constants.TextInputPattern), Validators.maxLength(255)]
            ],
            caseType: [this.selectedCaseType, [Validators.required, Validators.pattern('^((?!Please select).)*$')]]
        });

        if (this.isExistingHearingOrParticipantsAdded()) {
            ['caseType'].forEach(k => {
                this.form.get(k).disable();
            });
        }
    }

    retrieveDefaultSupplier(): VideoSupplier {
        return VideoSupplier.Vodafone;
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

    get caseNameInvalid() {
        return this.caseName.invalid && (this.caseName.dirty || this.caseName.touched || this.failedSubmission);
    }

    get caseNumberInvalid() {
        return this.caseNumber.invalid && (this.caseNumber.dirty || this.caseNumber.touched || this.failedSubmission);
    }

    get caseTypeInvalid() {
        return this.caseType.invalid && (this.caseType.dirty || this.caseType.touched || this.failedSubmission);
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

    get selectableCaseTypes(): string[] {
        return this.availableCaseTypes.map(c => c.name);
    }

    isFirstDayOfMultiDay(): boolean {
        const firstDay = this.hearing.hearingsInGroup[0];
        const isFirstDay = this.hearing.hearingId === firstDay.hearingId;
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
        this.hearing.caseType = this.availableCaseTypes.find(c => c.name === this.selectedCaseType);
        const hearingCase = new CaseModel();
        hearingCase.name = this.form.value.caseName;
        hearingCase.number = this.form.value.caseNumber;
        this.hearing.case = hearingCase;
        this.hearing.caseType.name = this.isExistingHearing ? this.hearing.caseType.name : this.form.getRawValue().caseType;
        this.hearing.caseType.serviceId = this.selectedCaseTypeServiceId;
        this.hearing.supplier = this.form.getRawValue().supplier ?? this.retrieveDefaultSupplier();
        this.hearingService.updateHearingRequest(this.hearing);
        this.logger.debug(`${this.loggerPrefix} Updated hearing request details`, { hearing: this.hearing });
    }

    private retrieveCaseTypes() {
        this.logger.debug(`${this.loggerPrefix} Retrieving case type`);
        this.referenceDataService.getCaseTypes().subscribe({
            next: (data: CaseTypeResponse[]) => {
                this.setupCaseTypes(data);
            },
            error: error => this.errorService.handleError(error)
        });
    }

    private setupCaseTypes(caseTypes: CaseTypeResponse[]) {
        this.logger.debug(`${this.loggerPrefix} Setting up case types`, {
            caseTypes: caseTypes.length
        });

        this.caseType.valueChanges.subscribe(val => {
            this.selectedCaseType = val;
            this.logger.debug(`${this.loggerPrefix} Updating selected Service`, {
                caseType: this.selectedCaseType
            });
            this.selectedCaseTypeServiceId = caseTypes.find(h => h.name === this.selectedCaseType)?.service_id;
            if (this.supportedSupplierOverrides.serviceIds.includes(this.selectedCaseTypeServiceId)) {
                this.displayOverrideSupplier = true;
            }
            this.displaySupplierOverrideIfSupported();
        });

        const caseTypeResponses = [...caseTypes];
        caseTypeResponses.sort(this.dynamicSort('name'));
        this.availableCaseTypes = caseTypeResponses
            .map(
                h =>
                    new CaseTypeModel({
                        name: h.name,
                        isAudioRecordingAllowed: h.is_audio_recording_allowed,
                        serviceId: h.service_id
                    })
            )
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort((a, b) => a.name.localeCompare(b.name));

        if (this.availableCaseTypes.length === 1) {
            this.selectedCaseType = this.availableCaseTypes[0].name;
            this.form.get('caseType').setValue(this.selectedCaseType);
            this.logger.debug(`${this.loggerPrefix} Only one available Service. Setting Service`);
        } else {
            this.availableCaseTypes.unshift(
                new CaseTypeModel({
                    name: Constants.PleaseSelect
                })
            );
        }
        this.displaySupplierOverrideIfSupported();
    }

    private displaySupplierOverrideIfSupported() {
        if (!this.selectedCaseType) {
            return;
        }
        const serviceId = this.availableCaseTypes.find(h => h.name === this.selectedCaseType)?.serviceId;
        if (serviceId && this.supportedSupplierOverrides.serviceIds.includes(serviceId)) {
            this.displayOverrideSupplier = true;
        } else {
            this.displayOverrideSupplier = false;
            this.form.get('supplier')?.setValue(this.retrieveDefaultSupplier(), { emitEvent: false });
        }
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
