import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Constants } from 'src/app/common/constants';
import { SanitizeInputText } from 'src/app/common/formatters/sanitize-input-text';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { BookingService } from 'src/app/services/booking.service';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';
import { DefenceAdvocateModel } from 'src/app/common/model/defence-advocate.model';

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
  newEndpoints: EndpointModel[] = [];
  availableDefenceAdvocates: DefenceAdvocateModel[] = [];

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
    this.$subscriptions.forEach((subcription) => {
      if (subcription) {
        subcription.unsubscribe();
      }
    });
  }

  get endpoints(): FormArray {
    return (<FormArray>this.form.get('endpoints'));
  }

  addEndpoint(): void {
    if (!this.hasDuplicateDisplayName(this.newEndpoints)) {
      this.failedValidation = false;
      this.endpoints.push(this.addEndpointsFormGroup());
    } else {
      this.failedValidation = true;
      console.log('an endpoint with the display name exists!');
    }
  }

  saveEndpoints(): void {
    const newEndpointsArray: EndpointModel[] = [];
    for (const control of this.endpoints.controls) {
      const endpointModel = new EndpointModel();
      if (control.value.displayName.trim() !== '') {
        const displayNameText = SanitizeInputText(control.value.displayName);
        endpointModel.displayName = displayNameText;
        endpointModel.Id = control.value.id;
        endpointModel.defenceAdvocate = control.value.defenceAdvocate.username;
        newEndpointsArray.push(endpointModel);
      }
    }

    if (!this.hasDuplicateDisplayName(newEndpointsArray)) {
      this.failedValidation = false;
      this.hearing.endpoints = newEndpointsArray;
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
        this.attemptingDiscardChanges = true;
      } else {
        this.router.navigate([PageUrls.Summary]);
      }
    } else {
      this.attemptingCancellation = true;
    }
  }

  continueBooking() {
    this.attemptingCancellation = false;
    this.attemptingDiscardChanges = false;
  }

  cancelEndpoints() {
    this.attemptingCancellation = false;
    this.form.reset();
    this.videoHearingService.cancelRequest();
    this.router.navigate([PageUrls.Dashboard]);
  }

  cancelChanges() {
    this.attemptingDiscardChanges = false;
    this.form.reset();
    this.navigateToSummary();
  }

  private checkForExistingRequest(): void {
    this.hearing = this.videoHearingService.getCurrentRequest();
  }

  private initialiseForm(): void {
    this.availableDefenceAdvocates = this.populateDefenceAdvocates();
    this.form = this.fb.group({
      endpoints: this.fb.array([
        this.addEndpointsFormGroup()
      ])
    });
    if (this.hearing.endpoints.length > 0) {
      this.newEndpoints = this.hearing.endpoints;
      console.log(this.hearing.endpoints);
      this.form.setControl('endpoints', this.setExistingEndpoints(this.newEndpoints));
    }

    this.$subscriptions.push(
      this.form.get('endpoints').valueChanges.subscribe(ep => {
        this.newEndpoints = ep;
        console.log(ep);
      })
    );
  }
  populateDefenceAdvocates(): DefenceAdvocateModel[] {
    const participants = this.hearing.participants.filter(
      p => p.hearing_role_name.toLowerCase() === this.constants.DefenceAdvocate.toLowerCase()
    );
    let defenceAdvocates: Array<DefenceAdvocateModel> = [];
    if (this.hearing.participants && this.hearing.participants.length > 0) {
      defenceAdvocates = participants.map(x => this.mapParticipantsToDefenceAdvocateModel(x));
    }
    const defenceAdvocateModel = new DefenceAdvocateModel();
    defenceAdvocateModel.id = null;
    defenceAdvocateModel.username = this.constants.None;
    defenceAdvocateModel.displayName = this.constants.None;
    defenceAdvocates.unshift(defenceAdvocateModel);
    return defenceAdvocates;
  }
  private mapParticipantsToDefenceAdvocateModel(participant: ParticipantModel): DefenceAdvocateModel {
    const defenceAdvocateModel = new DefenceAdvocateModel();
    defenceAdvocateModel.id = participant.id;
    defenceAdvocateModel.username = participant.username;
    defenceAdvocateModel.displayName = participant.display_name;
    return defenceAdvocateModel;
  }

  private setExistingEndpoints(endpoints: EndpointModel[]): FormArray {
    const formArray = new FormArray([]);
    endpoints.forEach(e => {
      formArray.push(this.fb.group({
        displayName: e.displayName,
        defenceAdvocate: e.defenceAdvocate
      }));
    });
    return formArray;
  }

  private addEndpointsFormGroup(): FormGroup {
    return this.fb.group({
      displayName: ['', [blankSpaceValidator]],
      defenceAdvocate: ['']
    });
  }

  hasDuplicateDisplayName(endpoints: EndpointModel[]): boolean {
    const listOfDisplayNames = endpoints.map(function (item) { return item.displayName; });
    const duplicateDisplayName = listOfDisplayNames.some(function (item, position) {
      return listOfDisplayNames.indexOf(item) !== position;
    });
    return duplicateDisplayName;
  }
  hasDuplicateDefenceAdvocate(endpoints: EndpointModel[]): boolean {
    const listOfDefenceAdvocates = endpoints.map(function (item) { return item.defenceAdvocate; });
    const duplicateDefenceAdvocate = listOfDefenceAdvocates.some(function (item, position) {
      return listOfDefenceAdvocates.indexOf(item) !== position;
    });
    console.log('Duplicate advocate name: ->' + duplicateDefenceAdvocate);
    return duplicateDefenceAdvocate;
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
