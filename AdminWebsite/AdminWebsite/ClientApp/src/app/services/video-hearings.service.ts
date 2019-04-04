import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  HearingTypeResponse, BHClient, BookNewHearingRequest, HearingDetailsResponse,
  CaseAndHearingRolesResponse, CaseRequest, ParticipantRequest, CaseResponse2,
  ParticipantResponse,
  EditHearingRequest,
  EditCaseRequest,
  EditParticipantRequest
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
    return keyRequest !== null || keyChanges === 'true';
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

  updateHearing(booking: HearingModel): Observable<HearingDetailsResponse> {
    const hearingRequest = this.mapExistingHearing(booking);
    return this.bhClient.editHearing(booking.hearing_id, hearingRequest);
  }

  mapExistingHearing(booking: HearingModel): EditHearingRequest {
    const hearing = new EditHearingRequest();
    if (booking.cases && booking.cases.length > 0) {
      hearing.case = new EditCaseRequest({ name: booking.cases[0].name, number: booking.cases[0].number });
    }
    hearing.hearing_room_name = booking.court_room;
    hearing.hearing_venue_name = booking.court_name;
    hearing.other_information = booking.other_information;
    hearing.scheduled_date_time = new Date(booking.scheduled_date_time);
    hearing.scheduled_duration = booking.scheduled_duration;
    hearing.participants = this.mapParticipantModelToEditParticipantRequest(booking.participants);
    return hearing;
  }

  mapParticipantModelToEditParticipantRequest(participants: ParticipantModel[]): EditParticipantRequest[] {
    let list: Array<EditParticipantRequest> = [];
    if (participants && participants.length > 0) {
      list = participants.map(x => this.mappingToEditParticipantRequest(x));
      }
    return list;
  }

  mappingToEditParticipantRequest(participant: ParticipantModel): EditParticipantRequest {
    const editParticipant = new EditParticipantRequest();
    editParticipant.id = participant.id;
    editParticipant.case_role_name = participant.case_role_name;
    editParticipant.contact_email = participant.email;
    editParticipant.display_name = participant.display_name;
    editParticipant.first_name = participant.first_name;
    editParticipant.last_name = participant.last_name;
    editParticipant.hearing_role_name = participant.hearing_role_name;
    editParticipant.middle_names = participant.middle_names;
    editParticipant.representee = participant.representee;
    editParticipant.solicitors_reference = participant.solicitorsReference;
    editParticipant.telephone_number = participant.phone;
    editParticipant.title = participant.title;
    editParticipant.house_number = participant.housenumber;
    editParticipant.street = participant.street;
    editParticipant.city = participant.city;
    editParticipant.county = participant.county;
    editParticipant.postcode = participant.postcode;
    return editParticipant;
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
    hearing.created_date = new Date(response.created_date);
    hearing.created_by = response.created_by;
    hearing.updated_date = new Date(response.updated_date);
    hearing.updated_by = response.updated_by;
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
    if (casesResponse && casesResponse.length > 0) {
      casesResponse.forEach(c => {
        caseRequest = new CaseModel();
        caseRequest.name = c.name;
        caseRequest.number = c.number;
        caseRequest.isLeadCase = c.is_lead_case;
        cases.push(caseRequest);
      });
    }
    return cases;
  }

  mapParticipants(newRequest: ParticipantModel[]): ParticipantRequest[] {
    const participants: ParticipantRequest[] = [];
    let participant: ParticipantRequest;
    if (newRequest && newRequest.length > 0) {
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
        participant.house_number = p.housenumber;
        participant.street = p.street;
        participant.city = p.city;
        participant.county = p.county;
        participant.postcode = p.postcode;
        participants.push(participant);
      });
    }
    return participants;
  }

  mapParticipantResponseToParticipantModel(response: ParticipantResponse[]): ParticipantModel[] {
    const participants: ParticipantModel[] = [];
    let participant: ParticipantModel;
    if (response && response.length > 0) {
      response.forEach(p => {
        participant = new ParticipantModel();
        participant.id = p.id;
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
        participant.housenumber = p.house_number;
        participant.street = p.street;
        participant.city = p.city;
        participant.county = p.county;
        participant.postcode = p.postcode;
        participants.push(participant);
      });
    }
    return participants;
  }

  getHearingById(hearingId: string): Observable<HearingDetailsResponse> {
    return this.bhClient.getHearingById(hearingId);
  }
}
