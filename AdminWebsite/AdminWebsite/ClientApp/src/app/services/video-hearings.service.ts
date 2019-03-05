import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  HearingTypeResponse, BHClient, BookNewHearingRequest, HearingDetailsResponse, CaseRoleResponse
} from './clients/api-client';
import { HearingModel } from '../common/model/hearing.model';

@Injectable({
  providedIn: 'root'
})
export class VideoHearingsService {
  private modelHearing: HearingModel;
  private newRequestKey: string;
  private bookingHasChangesKey: string;

  constructor(private bhClient: BHClient) {
    this.newRequestKey = 'bh-newRequest';
    this.bookingHasChangesKey = 'bookingHasChangesKey';
  }

  private checkForExistingHearing() {
    const localRequest = sessionStorage.getItem(this.newRequestKey);
    if (localRequest === null) {
      this.modelHearing = new HearingModel();
    } else {
      this.modelHearing = JSON.parse(localRequest);
    }
  }

  hasUnsavedChanges() {
    return sessionStorage.getItem(this.newRequestKey) !== null ||
      sessionStorage.getItem(this.bookingHasChangesKey) !== null;
  }

  onBookingChange(isChanged: boolean) {
    if (isChanged) {
      sessionStorage.setItem(this.bookingHasChangesKey, "true");
    } else {
      sessionStorage.removeItem(this.bookingHasChangesKey);
    }
  }

  getHearingTypes(): Observable<HearingTypeResponse[]> {
    return this.bhClient.getHearingTypes();
  }

  getCurrentRequest(): HearingModel {
    this.checkForExistingHearing();
    return this.modelHearing;
  }

  updateHearingRequest(updatedRequest: HearingModel) {
    this.modelHearing = updatedRequest;
    const localRequest = JSON.stringify(this.modelHearing);
    sessionStorage.setItem(this.newRequestKey, localRequest);
  }

  getParticipantRoles(): Observable<CaseRoleResponse[]> {
    return this.bhClient.getParticipantRoles();
  }

  cancelRequest() {
    sessionStorage.removeItem(this.newRequestKey);
    sessionStorage.removeItem(this.bookingHasChangesKey);
  }

  saveHearing(newRequest: HearingModel): Observable<number> {
    let hearingRequest = this.mapHearing(newRequest);
    return this.bhClient.bookNewHearing(hearingRequest);
  }

  mapHearing(newRequest: HearingModel): BookNewHearingRequest {
    throw new Error('Mapping of hearing request not implemented yet.');
  }

  getHearingById(hearingId: string): Observable<HearingDetailsResponse> {
    return this.bhClient.getHearingById(hearingId);
  }
}
