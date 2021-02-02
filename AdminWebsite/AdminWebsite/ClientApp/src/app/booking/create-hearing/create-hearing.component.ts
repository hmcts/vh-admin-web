import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HearingTypeResponse } from '../../services/clients/api-client';
import { HearingModel } from '../../common/model/hearing.model';
import { CaseModel } from '../../common/model/case.model';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';
import { BookingService } from '../../services/booking.service';
import { ErrorService } from 'src/app/services/error.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Constants } from 'src/app/common/constants';
import { SanitizeInputText } from '../../common/formatters/sanitize-input-text';
import { Subscription } from 'rxjs';
import { Logger } from 'src/app/services/logger';

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
    selectedHearingType: string;
    filteredHearingTypes: HearingTypeResponse[] = [];
    hasSaved: boolean;
    isExistingHearing: boolean;
    $subscriptions: Subscription[] = [];

    constructor(
        protected hearingService: VideoHearingsService,
        private fb: FormBuilder,
        protected router: Router,
        protected bookingService: BookingService,
        protected logger: Logger,
        private errorService: ErrorService
    ) {
        super(bookingService, router, hearingService, logger);
        this.attemptingCancellation = false;
        this.availableCaseTypes = [];
    }

    ngOnInit() {
        this.failedSubmission = false;
        this.checkForExistingRequestOrCreateNew();
        this.initForm();
        this.retrieveHearingTypes();
        super.ngOnInit();
    }

    goToDiv(fragment: string): void {
        window.document.getElementById(fragment).parentElement.parentElement.scrollIntoView();
    }

    private checkForExistingRequestOrCreateNew() {
        this.hearing = this.hearingService.getCurrentRequest();

        this.isExistingHearing = this.hearing?.hearing_id && this.hearing?.hearing_id?.length > 0;
        this.logger.debug(`${this.loggerPrefix} Checking for existing hearing.`);
        if (!!this.hearing.hearing_type_name && !!this.hearing.case_type) {
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
            const selectedHearingTypes = this.filteredHearingTypes.filter(x => x.name === this.hearing.hearing_type_name);
            if (!!selectedHearingTypes && selectedHearingTypes.length > 0) {
                this.hearing.hearing_type_id = selectedHearingTypes[0].id;
                this.form.get('hearingType').setValue(selectedHearingTypes[0].id);
            }
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
            hearingType: [this.hearing.hearing_type_id, [Validators.required, Validators.min(1)]]
        });
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
            if (this.form.dirty || this.form.touched) {
                this.logger.debug(`${this.loggerPrefix} In edit mode. Changes found. Confirm if changes should be discarded.`);
                this.attemptingDiscardChanges = true;
            } else {
                this.logger.debug(`${this.loggerPrefix} In edit mode. No changes. Returning to summary.`);
                this.router.navigate([PageUrls.Summary]);
            }
        } else {
            if (this.form.dirty || this.form.touched) {
                this.logger.debug(`${this.loggerPrefix} New booking. Changes found. Confirm if changes should be discarded.`);
                this.attemptingCancellation = true;
            } else {
                this.logger.debug(`${this.loggerPrefix} New booking. No changes found. Cancelling booking.`);
                this.cancelBooking();
            }
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
        this.hearing.case_type_id = this.form.value.caseType;
        this.hearing.hearing_type_id = this.form.value.hearingType;
        this.hearing.hearing_type_name = this.availableHearingTypes.find(c => c.id === this.hearing.hearing_type_id).name;
        this.hearing.questionnaire_not_required = false;

        this.hearingService.updateHearingRequest(this.hearing);
        this.logger.debug(`${this.loggerPrefix} Updated hearing request details`, { hearing: this.hearing });
    }

    private retrieveHearingTypes() {
        this.logger.debug(`${this.loggerPrefix} Retrieving hearing type`);
        this.$subscriptions.push(
            this.hearingService.getHearingTypes().subscribe(
                (data: HearingTypeResponse[]) => {
                    this.setupCaseTypeAndHearingTypes(data);
                    this.filterHearingTypes();
                    this.setHearingTypeForExistingHearing();
                },
                error => this.errorService.handleError(error)
            )
        );
    }

    private setupCaseTypeAndHearingTypes(hearingTypes: HearingTypeResponse[]) {
        this.logger.debug(`${this.loggerPrefix} Setting up hearing types`, {
            hearingTypes: hearingTypes.length
        });
        this.$subscriptions.push(
            this.caseType.valueChanges.subscribe(val => {
                this.selectedCaseType = val;
                this.logger.debug(`${this.loggerPrefix} Updating selected case type`, {
                    caseType: this.selectedCaseType
                });
                this.filterHearingTypes();
            })
        );

        this.availableHearingTypes = hearingTypes;
        this.availableHearingTypes.sort(this.dynamicSort('name'));
        this.availableCaseTypes = this.availableHearingTypes
            .map(h => h.group)
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort();

        if (this.availableCaseTypes.length === 1) {
            this.selectedCaseType = this.availableCaseTypes[0];
            this.form.get('caseType').setValue(this.selectedCaseType);
            this.logger.debug(`${this.loggerPrefix} Only one available case type. Setting case type`);
        } else {
            this.availableCaseTypes.unshift(Constants.PleaseSelect);
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

    private dynamicSort(property) {
        let sortOrder = 1;
        if (property[0] === '-') {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a, b) {
            const result = a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
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
        this.$subscriptions.forEach(subscription => {
            if (subscription) {
                subscription.unsubscribe();
            }
        });
    }
}
