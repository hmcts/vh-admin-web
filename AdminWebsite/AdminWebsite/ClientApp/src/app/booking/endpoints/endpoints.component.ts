import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Constants } from 'src/app/common/constants';
import { SanitizeInputText } from 'src/app/common/formatters/sanitize-input-text';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { BookingService } from 'src/app/services/booking.service';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';

@Component({
  selector: 'app-endpoints',
  templateUrl: './endpoints.component.html'
})
export class EndpointsComponent extends BookingBaseComponent implements OnInit, OnDestroy {
  canNavigate = true;
  constants = Constants;
  hearing: HearingModel;
  $subscriptions: Subscription[] = [];
  attemptingCancellation = false;
  attemptingDiscardChanges = false;
  failedValidation: boolean;

  constructor(
    private fb: FormBuilder,
    protected bookingService: BookingService,
    protected router: Router,
    protected videoHearingService: VideoHearingsService) {
    super(bookingService, router, videoHearingService);
  }

  ngOnInit(): void {
    this.failedValidation = false;
    this.checkForExistingRequest();
    this.initialiseForm();
    super.ngOnInit();
  }

  ngOnDestroy(): void {
    this.bookingService.removeEditMode();
  }

  get endpoints(): FormArray {
    return (<FormArray>this.form.get('endpoints'));
  }

  addEndpoint(): void {
    const newEndpointsArray: EndpointModel[] = [];
    for (const control of this.endpoints.controls) {
      const endpointModel = new EndpointModel();
      if (control.value.displayName !== '') {
        const displayNameText = SanitizeInputText(control.value.displayName);
        endpointModel.displayName = displayNameText;
        endpointModel.Id = control.value.id;
        newEndpointsArray.push(endpointModel);
      }
    }
    if (!this.hasDuplicateDisplayName(newEndpointsArray)) {
      console.log('no duplicate endpoints found!');
      this.failedValidation = false;
      this.endpoints.push(this.addEndpointsFormGroup());
    } else {
      this.failedValidation = true;
      console.log('an endpoint with the display name exists!');
    }
  }

  saveEndpoints(): void {
    const newEndpoints: EndpointModel[] = [];
    for (const control of this.endpoints.controls) {
      const endpointModel = new EndpointModel();
      if (control.value.displayName !== '') {
        const displayNameText = SanitizeInputText(control.value.displayName);
        endpointModel.displayName = displayNameText;
        endpointModel.Id = control.value.id;
        newEndpoints.push(endpointModel);
      }
    }
    if (!this.hasDuplicateDisplayName(newEndpoints)) {
      console.log('no duplicate endpoints found!');
      this.failedValidation = false;
      this.hearing.endpoints = newEndpoints;
      this.videoHearingService.updateHearingRequest(this.hearing);
      if (this.editMode) {
        this.router.navigate([PageUrls.Summary]);
      } else {
        this.router.navigate([PageUrls.OtherInformation]);
      }
    } else {
      this.failedValidation = true;
      console.log('an endpoint with the display name exists!');
    }
  }

  removeEndpoint(rowIndex: number): void {
    this.endpoints.removeAt(rowIndex);
  }

  cancelBooking(): void {
    if (this.editMode) {
      if (this.form.dirty || this.form.touched) {
        this.attemptingCancellation = true;
      } else {
        this.router.navigate([PageUrls.Summary]);
      }
    } else {
      this.attemptingCancellation = true;
    }
  }

  continueBooking() {
    this.attemptingCancellation = false;
  }

  cancelEndpoints() {
    this.attemptingCancellation = false;
    this.form.reset();
    this.videoHearingService.cancelRequest();
    this.router.navigate([PageUrls.Dashboard]);
  }

  private checkForExistingRequest(): void {
    this.hearing = this.videoHearingService.getCurrentRequest();
  }

  private initialiseForm(): void {
    this.form = this.fb.group({
      endpoints: this.fb.array([
        this.addEndpointsFormGroup()
      ])
    });
    if (this.hearing.endpoints.length > 0) {
      this.form.setControl('endpoints', this.setExistingEndpoints(this.hearing.endpoints));
    }
  }

  private setExistingEndpoints(endpoints: EndpointModel[]): FormArray {
    const formArray = new FormArray([]);
    endpoints.forEach(e => {
      formArray.push(this.fb.group({
        displayName: e.displayName,
        id: e.Id
      }));
    });
    return formArray;
  }

  private addEndpointsFormGroup(): FormGroup {
    return this.fb.group({
      displayName: ['', [blankSpaceValidator]],
      id: ['']
    });
  }

  hasDuplicateDisplayName(endpoints: EndpointModel[]): boolean {
    const listOfDisplayNames = endpoints.map(function (item) { return item.displayName; });
    const duplicateDisplayName = listOfDisplayNames.some(function (item, position) {
      return listOfDisplayNames.indexOf(item) !== position;
    });
    return duplicateDisplayName;
  }
}

function blankSpaceValidator(control: AbstractControl): { [key: string]: any } | null {
  const displayNameText: string = control.value;
  if (displayNameText !== null && displayNameText.replace(/\s/g, '').length) {
    return null;
  } else {
    return { 'blankSpaceValidator': true };
  }
}
