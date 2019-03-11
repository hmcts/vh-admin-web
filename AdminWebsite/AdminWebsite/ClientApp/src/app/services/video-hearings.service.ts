import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  HearingTypeResponse, BHClient, BookNewHearingRequest, HearingDetailsResponse, CaseRoleResponse, CaseRequest, ParticipantRequest
} from './clients/api-client';
import { HearingModel } from '../common/model/hearing.model';
import { CaseRequestModel } from '../common/model/case-request.model';

@Injectable({
  providedIn: 'root'
})
export class VideoHearingsService {

  private newRequestKey: string;
  private bookingHasChangesKey: string;
  private modelHearing: HearingModel;

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
      sessionStorage.setItem(this.bookingHasChangesKey, 'true');
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
    const hearingRequest = this.mapHearing(newRequest);
    return this.bhClient.bookNewHearing(hearingRequest);
  }

  mapHearing(newRequest: HearingModel): BookNewHearingRequest {
    // throw new Error('Mapping of hearing request not implemented yet.');
    let newHearingRequest = new BookNewHearingRequest();

    // case
    let cases = this.mapCases(newRequest);

    newHearingRequest.case_type_name = newRequest.case_type_name;
    newHearingRequest.hearing_type_name = newRequest.hearing_type_name;
    // schedule
    newHearingRequest.scheduled_date_time = newRequest.scheduled_date_time;
    newHearingRequest.scheduled_duration = newRequest.scheduled_duration;
    newHearingRequest.hearing_venue_name = newRequest.court_name;
    newHearingRequest.hearing_room_name = newRequest.court_room;

    // participants
    let participants = this.mapParticipants(newRequest);

    // other information
    newHearingRequest.other_information = newRequest.other_information;

    return newHearingRequest;
  }

  mapCases(newRequest: HearingModel): CaseRequest[] {
    let cases: CaseRequest[] = [];
    let caseRequest = new CaseRequest();
    newRequest.cases.forEach(c => {
      caseRequest.name = c.name;
      caseRequest.number = c.number;
      caseRequest.is_lead_case = false;

      cases.push(caseRequest);
    });
    return cases;
  }

  mapParticipants(newRequest: HearingModel): ParticipantRequest[] {
    let participants: ParticipantRequest[] = [];
    let participant = new ParticipantRequest();
    newRequest.participants.forEach(p => {
      participant.title = p.title;
      participant.first_name = p.first_name;
      participant.middle_names = p.middle_names;
      participant.last_name = p.last_name;
      participant.username = p.username;
      participant.display_name = p.display_name;
      participant.contact_email = p.email;
      participant.telephone_number = p.phone;
      participant.case_role_name = p.case_role_name;
      participant.hearing_role_name = p.hearing_role_name;
      participant.representee = p.representee;
      participant.solicitors_reference = p.solicitorsReference;

      participants.push(participant);
    });
    return participants;
  }

  getHearingById(hearingId: string): Observable<HearingDetailsResponse> {
    return this.bhClient.getHearingById(hearingId);
  }
}
