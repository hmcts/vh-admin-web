import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  HearingTypeResponse, BHClient, HearingRequest,
  HearingMediumResponse, ParticipantRoleResponse, HearingResponse, CaseRequest, FeedRequest, ParticipantRequest, ParticipantDetailsResponse
} from '../services/clients/api-client';
import { HearingModel, ParticipantModel } from '../common/model/hearing.model';

@Injectable({
  providedIn: 'root'
})
export class VideoHearingsService {

  private newRequestKey: string;
  private modelHearing: HearingModel;

  constructor(private bhClient: BHClient) {
    this.newRequestKey = 'bh-newRequest';
  }

  private checkForExistingHearing() {
    const localRequest = sessionStorage.getItem(this.newRequestKey);
    if (localRequest === null) {
      this.modelHearing = new HearingModel();
    } else {
      this.modelHearing = JSON.parse(localRequest);
    }
  }

  getHearingMediums(): Observable<HearingMediumResponse[]> {
    return this.bhClient.getHearingMediums();
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

  getParticipantRoles(): Observable<ParticipantRoleResponse[]> {
    return this.bhClient.getParticipantRoles();
  }

  cancelRequest() {
    sessionStorage.removeItem(this.newRequestKey);
  }

  saveHearing(newRequest: HearingModel): Observable<number> {
    let hearingRequest = this.mapHearing(newRequest);
    return this.bhClient.bookNewHearing(hearingRequest);
  }

  mapHearing(newRequest: HearingModel): HearingRequest {

    let caseRequest = new CaseRequest({
      number: newRequest.cases[0].number,
      name: newRequest.cases[0].name
    });

    let feeds: FeedRequest[] = [];
    newRequest.feeds.forEach(f => {
      let feed = new FeedRequest({
        location: f.location,
        participants: this.mapParticipants(f.participants)
      });
      feeds.push(feed);
    });

    let hearing = new HearingRequest({
      scheduled_date_time: new Date(newRequest.scheduled_date_time),
      scheduled_duration: newRequest.scheduled_duration,
      hearing_type_id: newRequest.hearing_type_id,
      hearing_medium_id: newRequest.hearing_medium_id,
      court_id: newRequest.court_id,
      cases: [],
      feeds: feeds,
      created_by: null
    });

    hearing.cases.push(caseRequest);
    return hearing;
  }

mapParticipants(participants: ParticipantModel[]): ParticipantRequest[]{
  let participantsRequest: ParticipantRequest[] = [];
  participants.forEach(p => {
    let part = new ParticipantRequest({
      title: p.title,
      first_name: p.first_name,
      last_name: p.last_name,
      middle_names: p.middle_names,
      display_name: p.display_name,
      username: p.username,
      email: p.email,
      external_id: p.external_id,
      external_flag: p.external_flag,
      role: p.role,
      phone: p.phone,
      mobile: p.mobile,
      representing: p.representing,
      organisation_name: p.organisation_name,
      organisation_address: p.organisation_address
    });
    participantsRequest.push(part);
  });

  return participantsRequest;
}

  getHearingById(hearingId: number): Observable<HearingResponse> {
    return this.bhClient.getHearingById(hearingId);
  }
}
