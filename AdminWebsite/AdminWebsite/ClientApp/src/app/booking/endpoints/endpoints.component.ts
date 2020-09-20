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
  participants: ParticipantModel[] = [];
  select: any[] = [];

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
    if (!this.hasDuplicateDisplayName(this.newEndpoints) && !this.hasDuplicateDefenceAdvocate(this.newEndpoints)) {
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
        endpointModel.id = control.value.id;
        endpointModel.defenceAdvocate = control.value.defenceAdvocate !== this.constants.None ? control.value.defenceAdvocate : '';
        newEndpointsArray.push(endpointModel);
      }
    }

    if (!this.hasDuplicateDisplayName(newEndpointsArray) && !this.hasDuplicateDefenceAdvocate(newEndpointsArray)) {
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
    this.participants = this.hearing.participants.filter(
      p => p.hearing_role_name === this.constants.DefenceAdvocate
    );
  }
  private initialiseForm(): void {
    this.availableDefenceAdvocates = this.populateDefenceAdvocates();
    this.select.push(this.availableDefenceAdvocates);
    this.form = this.fb.group({
      endpoints: this.fb.array([
        this.addEndpointsFormGroup()
      ])
    });
    if (this.hearing.endpoints.length > 0) {
      this.newEndpoints = this.hearing.endpoints;
      this.form.setControl('endpoints', this.setExistingEndpoints(this.newEndpoints));
    }
    this.$subscriptions.push(
      this.form.get('endpoints').valueChanges.subscribe(ep => {
        this.newEndpoints = ep;
      })
    );
  }
  private setExistingEndpoints(endpoints: EndpointModel[]): FormArray {
    const formArray = new FormArray([]);
    endpoints.forEach(e => {
      formArray.push(
        this.fb.group({
          id: e.id,
          displayName: e.displayName,
          defenceAdvocateId: e.defenceAdvocate,
          defenceAdvocate: e.defenceAdvocate === undefined ? 'None' : this.getUsernameFromId(e.defenceAdvocate)
        }));
      const dA = e.defenceAdvocate === undefined ? 'None' : this.getUsernameFromId(e.defenceAdvocate);
      console.log(dA);
      if (dA !== this.constants.None) {
        const dARow = this.availableDefenceAdvocates.find(da => da.username === dA);
        if (dARow) {
          this.availableDefenceAdvocates.find(da => da.username === dA).isSelected = true;
        }
      }
      this.availableDefenceAdvocates = this.availableDefenceAdvocates.filter(p => p.isSelected !== true);
      this.select.push(this.availableDefenceAdvocates);
      console.log(this.select);
    });
    return formArray;
  }
  private populateDefenceAdvocates(): DefenceAdvocateModel[] {
    let defenceAdvocates: Array<DefenceAdvocateModel> = [];
    if (this.hearing.participants && this.hearing.participants.length > 0) {
      defenceAdvocates = this.participants.map(x => this.mapParticipantsToDefenceAdvocateModel(x));
    }
    const defenceAdvocateModel = Object.assign(new DefenceAdvocateModel(), {
      id: null,
      username: this.constants.None,
      displayName: this.constants.None,
      isSelected: null
    });
    defenceAdvocates.unshift(defenceAdvocateModel);
    return defenceAdvocates;
  }
  mapParticipantsToDefenceAdvocateModel(participant: ParticipantModel): DefenceAdvocateModel {
    const defenceAdvocateModel = Object.assign(new DefenceAdvocateModel(), {
      id: participant.id,
      username: participant.username,
      displayName: participant.display_name,
      isSelected: null
    });
    return defenceAdvocateModel;
  }
  updateSelection(event: any) {
    const userName = event.target.value;
    console.log(userName);
    if (userName !== this.constants.None) {
      this.availableDefenceAdvocates.find(da => da.username === event.target.value).isSelected = true;
    }
    this.availableDefenceAdvocates = this.availableDefenceAdvocates.filter(x => x.isSelected !== true);
    this.select.push(this.availableDefenceAdvocates);
    console.log(this.select);
  }
  getUsernameFromId(participantId: string): string {
    const defAdv = this.hearing.participants.find(p => p.id === participantId);
    if (defAdv) {
      return defAdv.username;
    }
    return participantId;
  }
  private addEndpointsFormGroup(): FormGroup {
    return this.fb.group({
      displayName: ['', [blankSpaceValidator]],
      defenceAdvocate: ['None'],
      id: [],
      defenceAdvocateId: [],
    });
  }

  private hasDuplicateDisplayName(endpoints: EndpointModel[]): boolean {
    const listOfDisplayNames = endpoints.map(function (item) { return item.displayName; });
    const duplicateDisplayName = listOfDisplayNames.some(function (item, position) {
      return listOfDisplayNames.indexOf(item) !== position;
    });
    return duplicateDisplayName;
  }
  private hasDuplicateDefenceAdvocate(endpoints: EndpointModel[]): boolean {
    const listOfDefenceAdvocates = endpoints.filter(function (item) {
      if (item.defenceAdvocate === '' || item.defenceAdvocate === 'None' || item.defenceAdvocate === undefined) { return false; }
      return true;
    }).map(function (item) { return item.defenceAdvocate; });
    const duplicateDefenceAdvocate = listOfDefenceAdvocates.some(function (item, position) {
      return listOfDefenceAdvocates.indexOf(item) !== position;
    });
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
