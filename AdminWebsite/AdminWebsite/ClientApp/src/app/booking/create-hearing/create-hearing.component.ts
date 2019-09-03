import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { HearingTypeResponse } from '../../services/clients/api-client';
import { HearingModel } from '../../common/model/hearing.model';
import { CaseModel } from '../../common/model/case.model';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingBaseComponent } from '../booking-base/booking-base.component';
import { BookingService } from '../../services/booking.service';
import { ErrorService } from 'src/app/services/error.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Constants } from 'src/app/common/constants';

@Component({
  selector: 'app-create-hearing',
  templateUrl: './create-hearing.component.html',
  styleUrls: ['./create-hearing.component.scss']
})
export class CreateHearingComponent extends BookingBaseComponent implements OnInit {
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

  constructor(protected hearingService: VideoHearingsService,
    private fb: FormBuilder,
    protected router: Router,
    protected bookingService: BookingService,
    private errorService: ErrorService) {
    super(bookingService, router, hearingService);
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

    this.isExistingHearing = this.hearing.hearing_id && this.hearing.hearing_id.length > 0;

    if (!!this.hearing.hearing_type_name && !!this.hearing.case_type) {
      this.selectedCaseType = this.hearing.case_type;
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
      caseName: [firstCase.name, Validators.required],
      caseNumber: [firstCase.number, Validators.required],
      caseType: [this.selectedCaseType, [Validators.required, Validators.pattern('^((?!Please select).)*$')]],
      hearingType: [this.hearing.hearing_type_id, [Validators.required, Validators.min(1)]],
      questionnaireNotRequired: [this.hearing.questionnaire_not_required]
    });
  }

  get caseName() { return this.form.get('caseName'); }
  get caseNumber() { return this.form.get('caseNumber'); }
  get caseType() { return this.form.get('caseType'); }
  get hearingType() { return this.form.get('hearingType'); }
  get questionnaireNotRequired() { return this.form.get('questionnaireNotRequired').value; }

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
      this.failedSubmission = false;
      this.updateHearingRequest();
      this.form.markAsPristine();
      this.hasSaved = true;
      if (this.editMode) {
        this.navigateToSummary();
      } else {
        this.router.navigate([PageUrls.HearingSchedule]);
      }
    } else {
      this.failedSubmission = true;
    }
  }

  continueBooking() {
    this.attemptingCancellation = false;
    this.attemptingDiscardChanges = false;
  }

  confirmCancelBooking() {
    if (this.editMode) {
      if (this.form.dirty || this.form.touched) {
        this.attemptingDiscardChanges = true;
      } else {
        this.navigateToSummary();
      }
    } else {
      if (this.form.dirty || this.form.touched) {
        this.attemptingCancellation = true;
      } else {
        this.cancelBooking();
      }
    }
  }

  cancelBooking() {
    this.attemptingCancellation = false;
    this.hearingService.cancelRequest();
    this.form.reset();
    this.router.navigate([PageUrls.Dashboard]);
  }

  cancelChanges() {
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
    this.hearing.questionnaire_not_required = this.form.value.questionnaireNotRequired;

    this.hearingService.updateHearingRequest(this.hearing);
  }

  private retrieveHearingTypes() {
    this.hearingService.getHearingTypes()
      .subscribe(
        (data: HearingTypeResponse[]) => {
          this.setupCaseTypeAndHearingTypes(data);
          this.filterHearingTypes();
          this.setHearingTypeForExistingHearing();
        },
        error => this.errorService.handleError(error)
      );
  }

  private setupCaseTypeAndHearingTypes(hearingTypes: HearingTypeResponse[]) {
    this.caseType.valueChanges.subscribe(val => {
      this.selectedCaseType = val;
      this.filterHearingTypes();
    });

    this.availableHearingTypes = hearingTypes;
    this.availableHearingTypes.sort(this.dynamicSort('name'));
    this.availableCaseTypes = this.availableHearingTypes.map(h => h.group);

    if (this.availableCaseTypes.length === 1) {
      this.selectedCaseType = this.availableCaseTypes[0];
      this.form.get('caseType').setValue(this.selectedCaseType);
    } else {
      this.availableCaseTypes.unshift(Constants.PleaseSelect);
    }
  }

  private filterHearingTypes() {
    this.filteredHearingTypes = [];
    if (this.selectedCaseType) {
      this.filteredHearingTypes = this.availableHearingTypes.filter(h => h.group === this.selectedCaseType);
    }
    const pleaseSelect = new HearingTypeResponse();
    pleaseSelect.name = Constants.PleaseSelect;
    pleaseSelect.id = null;
    this.filteredHearingTypes.unshift(pleaseSelect);
  }

  private dynamicSort(property) {
    let sortOrder = 1;
    if (property[0] === '-') {
      sortOrder = -1;
      property = property.substr(1);
    }
    return function (a, b) {
      const result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
      return result * sortOrder;
    };
  }
}
