import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  HearingTypeResponse, BHClient, BookNewHearingRequest, HearingDetailsResponse,
  CaseAndHearingRolesResponse, CaseRequest, ParticipantRequest, CaseResponse2,
  ParticipantResponse
} from './clients/api-client';
import { HearingModel } from '../common/model/hearing.model';
import { CaseModel } from '../common/model/case.model';
import { ParticipantModel } from '../common/model/participant.model';

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

  hasUnsavedChanges(): boolean {
    const keyRequest = sessionStorage.getItem(this.newRequestKey);
    const keyChanges = sessionStorage.getItem(this.bookingHasChangesKey);
    return keyRequest === this.newRequestKey || keyChanges === this.bookingHasChangesKey;
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

  validCurrentRequest() {
    const localRequest = this.getCurrentRequest();
    const valid = localRequest.scheduled_date_time && localRequest.scheduled_duration > 0 &&
      localRequest.participants.length > 1 && localRequest.hearing_venue_id > 0 &&
      localRequest.hearing_type_id > 0;
    return valid;
  }

  updateHearingRequest(updatedRequest: HearingModel) {
    this.modelHearing = updatedRequest;
    const localRequest = JSON.stringify(this.modelHearing);
    sessionStorage.setItem(this.newRequestKey, localRequest);
  }

  getParticipantRoles(caseTypeName: string): Observable<CaseAndHearingRolesResponse[]> {
    return this.bhClient.getParticipantRoles(caseTypeName);
  }

  cancelRequest() {
    sessionStorage.removeItem(this.newRequestKey);
    sessionStorage.removeItem(this.bookingHasChangesKey);
  }

  saveHearing(newRequest: HearingModel): Observable<HearingDetailsResponse> {
    const hearingRequest = this.mapHearing(newRequest);
    return this.bhClient.bookNewHearing(hearingRequest);
  }

  mapHearing(newRequest: HearingModel): BookNewHearingRequest {
    const newHearingRequest = new BookNewHearingRequest();
    newHearingRequest.cases = this.mapCases(newRequest);
    newHearingRequest.case_type_name = newRequest.case_type;
    newHearingRequest.hearing_type_name = newRequest.hearing_type_name;
    newHearingRequest.scheduled_date_time = new Date(newRequest.scheduled_date_time);
    newHearingRequest.scheduled_duration = newRequest.scheduled_duration;
    newHearingRequest.hearing_venue_name = newRequest.court_name;
    newHearingRequest.hearing_room_name = newRequest.court_room;
    newHearingRequest.participants = this.mapParticipants(newRequest.participants);
    newHearingRequest.other_information = newRequest.other_information;
    console.log(newHearingRequest);
    return newHearingRequest;
  }

  mapHearingDetailsResponseToHearingModel(response: HearingDetailsResponse): HearingModel {
    const hearing = new HearingModel();
    hearing.hearing_id = response.id;
    hearing.cases = this.mapCaseResponse2ToCaseModel(response.cases);
    hearing.hearing_type_name = response.hearing_type_name;
    hearing.case_type = response.case_type_name;
    hearing.scheduled_date_time = new Date(response.scheduled_date_time);
    hearing.scheduled_duration = response.scheduled_duration;
    hearing.court_name = response.hearing_venue_name;
    hearing.court_room = response.hearing_room_name;
    hearing.participants = this.mapParticipantResponseToParticipantModel(response.participants);
    hearing.other_information = response.other_information;
    return hearing;
  }

  mapCases(newRequest: HearingModel): CaseRequest[] {
    const cases: CaseRequest[] = [];
    let caseRequest: CaseRequest;
    newRequest.cases.forEach(c => {
      caseRequest = new CaseRequest();
      caseRequest.name = c.name;
      caseRequest.number = c.number;
      caseRequest.is_lead_case = false;
      cases.push(caseRequest);
    });
    return cases;
  }

  mapCaseResponse2ToCaseModel(casesResponse: CaseResponse2[]): CaseModel[] {
    const cases: CaseModel[] = [];
    let caseRequest: CaseModel;
    casesResponse.forEach(c => {
      caseRequest = new CaseModel();
      caseRequest.name = c.name;
      caseRequest.number = c.number;
      caseRequest.isLeadCase = c.is_lead_case;
      cases.push(caseRequest);
    });
    return cases;
  }

  mapParticipants(newRequest: ParticipantModel[]): ParticipantRequest[] {
    const participants: ParticipantRequest[] = [];
    let participant: ParticipantRequest;
    newRequest.forEach(p => {
      participant = new ParticipantRequest();
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

  mapParticipantResponseToParticipantModel(response: ParticipantResponse[]): ParticipantModel[] {
    const participants: ParticipantModel[] = [];
    let participant: ParticipantModel;
    response.forEach(p => {
      participant = new ParticipantModel();
      participant.title = p.title;
      participant.first_name = p.first_name;
      participant.middle_names = p.middle_names;
      participant.last_name = p.last_name;
      participant.username = p.username;
      participant.display_name = p.display_name;
      participant.email = p.contact_email;
      participant.phone = p.telephone_number;
      participant.case_role_name = p.case_role_name;
      participant.hearing_role_name = p.hearing_role_name;
      participant.representee = '';
      participant.solicitorsReference = '';
      participant.is_judge = p.case_role_name === 'Judge';
      participants.push(participant);
    });
    return participants;
  }

  getHearingById(hearingId: string): Observable<HearingDetailsResponse> {
    return this.bhClient.getHearingById(hearingId);
  }

  updateBookingStatus(hearingId: string): Observable<void> {
    return this.bhClient.updateBookingStatus(hearingId);
  }
}
