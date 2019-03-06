import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { CanDeactiveComponent } from '../../common/guards/changes.guard';
import { HearingTypeResponse } from '../../services/clients/api-client';
import { HearingModel } from '../../common/model/hearing.model';
import { CaseModel } from '../../common/model/case.model';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingBaseComponent } from '../booking-base/booking-base.component';
import { BookingService } from '../../services/booking.service';
import { ErrorService } from 'src/app/services/error.service';

@Component({
  selector: 'app-create-hearing',
  templateUrl: './create-hearing.component.html',
  styleUrls: ['./create-hearing.component.scss']
})
export class CreateHearingComponent extends BookingBaseComponent implements OnInit, CanDeactiveComponent {

  private existingCaseTypeKey = 'selectedCaseType';
  attemptingCancellation: boolean;
  failedSubmission: boolean;
  hearing: HearingModel;
  hearingForm: FormGroup;
  availableHearingTypes: HearingTypeResponse[];
  availableCaseTypes: string[];
  selectedCaseType: string;
  filteredHearingTypes: HearingTypeResponse[];
  hasSaved: boolean;

  constructor(private hearingService: VideoHearingsService,
    private fb: FormBuilder,
    protected router: Router,
    protected bookingService: BookingService,
    private errorService: ErrorService) {
    super(bookingService, router);
    this.attemptingCancellation = false;
    this.availableCaseTypes = [];
  }

  ngOnInit() {
    super.ngOnInit();
    this.failedSubmission = false;
    this.checkForExistingRequest();
    this.initForm();
    this.retrieveHearingTypes();
  }

  goToDiv(fragment: string): void {
    window.document.getElementById(fragment).parentElement.parentElement.scrollIntoView();
  }

  private checkForExistingRequest() {
    this.hearing = this.hearingService.getCurrentRequest();
    if (this.hearing) {
      this.hasSaved = true;
    }
    const existingType = sessionStorage.getItem(this.existingCaseTypeKey);
    if (this.hearing.hearing_type_id !== undefined && existingType !== null) {
      this.selectedCaseType = existingType;
    } else {
      this.selectedCaseType = 'Please Select';
    }
  }

  private initForm() {
    let firstCase = this.hearing.cases[0];
    if (!firstCase) {
      firstCase = new CaseModel();
    }
    this.hearingForm = this.fb.group({
      caseName: [firstCase.name, Validators.required],
      caseNumber: [firstCase.number, Validators.required],
      caseType: [this.selectedCaseType, [Validators.required, Validators.pattern('^((?!Please Select).)*$')]],
      hearingType: [this.hearing.hearing_type_id, [Validators.required, Validators.min(1)]]
    });
  }

  get caseName() { return this.hearingForm.get('caseName'); }
  get caseNumber() { return this.hearingForm.get('caseNumber'); }
  get caseType() { return this.hearingForm.get('caseType'); }
  get hearingType() { return this.hearingForm.get('hearingType'); }

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
    if (this.hearingForm.valid) {
      this.failedSubmission = false;
      this.updateHearingRequest();
      sessionStorage.setItem(this.existingCaseTypeKey, this.selectedCaseType);
      this.hearingForm.markAsPristine();
      this.hasSaved = true;
      if (this.editMode) {
        this.navigateToSummary();
      } else {
        this.router.navigate(['/hearing-schedule']);
      }
    } else {
      this.failedSubmission = true;
    }
  }

  continueBooking() {
    this.attemptingCancellation = false;
  }

  confirmCancelBooking() {
    if (this.editMode) {
      this.navigateToSummary();
    }
    else {
      this.attemptingCancellation = true;
    }
  }

  cancelBooking() {
    this.attemptingCancellation = false;
    this.hearingService.cancelRequest();
    sessionStorage.removeItem(this.existingCaseTypeKey);
    this.hearingForm.reset();
    this.router.navigate(['/dashboard']);
  }

  private updateHearingRequest() {
    this.hearing.hearing_type_id = this.hearingForm.value.hearingType;
    this.hearing.hearing_medium_id = this.hearingForm.value.hearingMethod;

    const hearingCase = new CaseModel();
    hearingCase.name = this.hearingForm.value.caseName;
    hearingCase.number = this.hearingForm.value.caseNumber;
    this.hearing.cases[0] = hearingCase;
    this.hearingService.updateHearingRequest(this.hearing);
  }

  private retrieveHearingTypes() {
    this.hearingService.getHearingTypes()
      .subscribe(
        (data: HearingTypeResponse[]) => {
          this.setupCaseTypeAndHearingTypes(data);
          this.filterHearingTypes();
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
      this.hearingForm.get('caseType').setValue(this.selectedCaseType);
    } else {
      this.availableCaseTypes.unshift('Please Select');
    }
  }

  private filterHearingTypes() {
    this.filteredHearingTypes = [];
    if (this.selectedCaseType) {
      this.filteredHearingTypes = this.availableHearingTypes.filter(h => h.group === this.selectedCaseType);
    }
    const pleaseSelect = new HearingTypeResponse();
    pleaseSelect.name = 'Please Select';
    pleaseSelect.id = -1;
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

  hasChanges(): Observable<boolean> | boolean {
    if (this.hearingForm.dirty) {
      this.confirmCancelBooking();
    }
    return this.hearingForm.dirty;
  }
}
