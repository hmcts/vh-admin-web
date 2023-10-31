import { Injectable } from '@angular/core';
import { firstValueFrom, lastValueFrom, Observable } from 'rxjs';
import {
    BHClient,
    BookingDetailsRequest,
    CaseAndHearingRolesResponse,
    CaseRequest,
    CaseResponse,
    EditCaseRequest,
    EditEndpointRequest,
    EditHearingRequest,
    EditParticipantRequest,
    EndpointRequest,
    EndpointResponse,
    HearingDetailsResponse,
    HearingTypeResponse,
    ParticipantRequest,
    ParticipantResponse,
    UpdateBookingStatusRequest,
    UpdateBookingStatusResponse,
    MultiHearingRequest,
    PhoneConferenceResponse,
    BookHearingRequest,
    LinkedParticipantRequest,
    LinkedParticipantResponse,
    LinkedParticipant,
    BookingStatus,
    AllocatedCsoResponse,
    HearingRoleResponse,
    JudiciaryParticipantRequest
} from './clients/api-client';
import { HearingModel } from '../common/model/hearing.model';
import { CaseModel } from '../common/model/case.model';
import { ParticipantModel } from '../common/model/participant.model';
import { EndpointModel } from '../common/model/endpoint.model';
import { LinkedParticipantModel } from '../common/model/linked-participant.model';
import { Constants } from '../common/constants';
import * as moment from 'moment';
import { JudicialMemberDto } from '../booking/judicial-office-holders/models/add-judicial-member.model';

@Injectable({
    providedIn: 'root'
})
export class VideoHearingsService {
    private readonly newRequestKey: string;
    private readonly bookingHasChangesKey: string;
    private readonly conferencePhoneNumberKey: string;
    private readonly conferencePhoneNumberWelshKey: string;
    private readonly vhoNonAvailabiltiesHaveChangesKey: string;

    private modelHearing: HearingModel;
    private participantRoles = new Map<string, CaseAndHearingRolesResponse[]>();
    private judiciaryRoles = Constants.JudiciaryRoles;

    constructor(private bhClient: BHClient) {
        this.newRequestKey = 'bh-newRequest';
        this.bookingHasChangesKey = 'bookingHasChangesKey';
        this.conferencePhoneNumberKey = 'conferencePhoneNumberKey';
        this.conferencePhoneNumberWelshKey = 'conferencePhoneNumberWelshKey';
        this.vhoNonAvailabiltiesHaveChangesKey = 'vhoNonAvailabiltiesHaveChangesKey';

        this.checkForExistingHearing();
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
        const request = sessionStorage.getItem(this.newRequestKey);
        let existingHearing = false;

        if (request) {
            const model: HearingModel = JSON.parse(request);
            existingHearing = model.hearing_id && model.hearing_id.length > 0;
        }

        const keyChanges = sessionStorage.getItem(this.bookingHasChangesKey);

        return (request !== null && !existingHearing) || keyChanges === 'true';
    }

    hasUnsavedVhoNonAvailabilityChanges(): boolean {
        const request = sessionStorage.getItem(this.vhoNonAvailabiltiesHaveChangesKey);
        return !!request;
    }

    setBookingHasChanged(isChanged: boolean) {
        if (isChanged) {
            sessionStorage.setItem(this.bookingHasChangesKey, 'true');
        } else {
            sessionStorage.removeItem(this.bookingHasChangesKey);
        }
    }

    setVhoNonAvailabiltiesHaveChanged(isChanged: boolean) {
        if (isChanged) {
            sessionStorage.setItem(this.vhoNonAvailabiltiesHaveChangesKey, 'true');
        } else {
            sessionStorage.removeItem(this.vhoNonAvailabiltiesHaveChangesKey);
        }
    }

    cancelVhoNonAvailabiltiesRequest() {
        sessionStorage.removeItem(this.vhoNonAvailabiltiesHaveChangesKey);
    }

    getHearingTypes(includeDeleted: boolean = false): Observable<HearingTypeResponse[]> {
        return this.bhClient.getHearingTypes(includeDeleted);
    }

    getCurrentRequest(): HearingModel {
        return this.modelHearing;
    }

    validCurrentRequest() {
        const localRequest = this.getCurrentRequest();

        return (
            localRequest.scheduled_date_time &&
            localRequest.scheduled_duration > 0 &&
            localRequest.participants.length > 1 &&
            localRequest.hearing_venue_id > 0 &&
            localRequest.hearing_type_id > 0
        );
    }

    updateHearingRequest(updatedRequest: HearingModel) {
        this.modelHearing = updatedRequest;
        const localRequest = JSON.stringify(this.modelHearing);
        sessionStorage.setItem(this.newRequestKey, localRequest);
    }

    async getParticipantRoles(caseTypeName: string): Promise<CaseAndHearingRolesResponse[]> {
        if (this.participantRoles.has(caseTypeName)) {
            return this.participantRoles.get(caseTypeName);
        }
        const roles = await firstValueFrom(this.bhClient.getParticipantRoles(caseTypeName));
        this.participantRoles.set(caseTypeName, roles);
        return roles;
    }

    async getHearingRoles(): Promise<HearingRoleResponse[]> {
        const roles = await firstValueFrom(this.bhClient.getHearingRoles());
        return roles;
    }

    cancelRequest() {
        this.modelHearing = new HearingModel();
        sessionStorage.removeItem(this.newRequestKey);
        sessionStorage.removeItem(this.bookingHasChangesKey);
    }

    getStatus(hearingId: string) {
        return lastValueFrom(this.bhClient.getHearingConferenceStatus(hearingId));
    }

    updateFailedStatus(hearingId: string) {
        return lastValueFrom(this.bhClient.updateFailedBookingStatus(hearingId));
    }

    saveHearing(newRequest: HearingModel): Promise<HearingDetailsResponse> {
        const hearingRequest = this.mapHearing(newRequest);
        const bookingRequest = new BookHearingRequest({
            booking_details: hearingRequest
        });
        bookingRequest.booking_details.other_information = hearingRequest.other_information;
        bookingRequest.other_information_details = hearingRequest.other_information;

        if (newRequest.multiDays) {
            bookingRequest.is_multi_day = true;
            if (newRequest.hearing_dates.length) {
                bookingRequest.multi_hearing_details = new MultiHearingRequest({
                    hearing_dates: newRequest.hearing_dates.map(hearingDate => new Date(hearingDate))
                });
            } else {
                bookingRequest.multi_hearing_details = new MultiHearingRequest({
                    start_date: new Date(newRequest.scheduled_date_time),
                    end_date: new Date(newRequest.end_hearing_date_time)
                });
            }
        }

        return lastValueFrom(this.bhClient.bookNewHearing(bookingRequest));
    }

    async cloneMultiHearings(hearingId: string, request: MultiHearingRequest): Promise<void> {
        return await lastValueFrom(this.bhClient.cloneHearing(hearingId, request));
    }

    rebookHearing(hearingId: string): Promise<void> {
        return lastValueFrom(this.bhClient.rebookHearing(hearingId));
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
        hearing.hearing_venue_code = booking.court_code;
        hearing.other_information = booking.other_information;
        hearing.scheduled_date_time = new Date(booking.scheduled_date_time);
        hearing.scheduled_duration = booking.scheduled_duration;
        hearing.participants = this.mapParticipantModelToEditParticipantRequest(booking.participants);
        hearing.audio_recording_required = booking.audio_recording_required;
        hearing.endpoints = this.mapEndpointModelToEditEndpointRequest(booking.endpoints);
        return hearing;
    }

    mapParticipantModelToEditParticipantRequest(participants: ParticipantModel[]): EditParticipantRequest[] {
        let list: Array<EditParticipantRequest> = [];
        if (participants && participants.length > 0) {
            list = participants.map(x => this.mappingToEditParticipantRequest(x));
        }
        return list;
    }

    mapEndpointModelToEditEndpointRequest(endpoints: EndpointModel[]): EditEndpointRequest[] {
        let list: EditEndpointRequest[] = [];
        if (endpoints && endpoints.length > 0) {
            list = endpoints.map(x => this.mappingToEditEndpointRequest(x));
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
        editParticipant.hearing_role_code = participant.hearing_role_code;
        editParticipant.middle_names = participant.middle_names;
        editParticipant.representee = participant.representee;
        editParticipant.telephone_number = participant.phone;
        editParticipant.title = participant.title;
        editParticipant.organisation_name = participant.company;
        editParticipant.linked_participants = this.mapLinkedParticipantModelToEditLinkedParticipantRequest(participant.linked_participants);
        return editParticipant;
    }

    mapLinkedParticipantModelToEditLinkedParticipantRequest(linkedParticipants: LinkedParticipantModel[]): LinkedParticipant[] {
        let list: LinkedParticipant[] = [];
        if (linkedParticipants && linkedParticipants.length > 0) {
            list = linkedParticipants.map(x => this.mappingToEditLinkedParticipantRequest(x));
        }
        return list;
    }
    mappingToEditLinkedParticipantRequest(linkedParticipant: LinkedParticipantModel): LinkedParticipant {
        const editLinkedParticipant = new LinkedParticipant();
        editLinkedParticipant.type = linkedParticipant.linkType;
        editLinkedParticipant.linked_id = linkedParticipant.linkedParticipantId;
        editLinkedParticipant.participant_id = linkedParticipant.participantId;
        editLinkedParticipant.participant_contact_email = linkedParticipant.participantEmail;
        editLinkedParticipant.linked_participant_contact_email = linkedParticipant.linkedParticipantEmail;
        return editLinkedParticipant;
    }

    mappingToEditEndpointRequest(endpoint: EndpointModel): EditEndpointRequest {
        const editEndpoint = new EditEndpointRequest();
        editEndpoint.id = endpoint.id;
        editEndpoint.display_name = endpoint.displayName;
        editEndpoint.defence_advocate_contact_email = endpoint.defenceAdvocate;
        return editEndpoint;
    }

    mapHearing(newRequest: HearingModel): BookingDetailsRequest {
        const newHearingRequest = new BookingDetailsRequest();
        newHearingRequest.cases = this.mapCases(newRequest);
        newHearingRequest.case_type_name = newRequest.case_type;
        newHearingRequest.case_type_service_id = newRequest.case_type_service_id;
        newHearingRequest.hearing_type_name = newRequest.hearing_type_name;
        newHearingRequest.hearing_type_code = newRequest.hearing_type_code;
        newHearingRequest.scheduled_date_time = new Date(newRequest.scheduled_date_time);
        newHearingRequest.scheduled_duration = newRequest.scheduled_duration;
        newHearingRequest.hearing_venue_name = newRequest.court_name;
        newHearingRequest.hearing_venue_code = newRequest.court_code;
        newHearingRequest.hearing_room_name = newRequest.court_room;
        newHearingRequest.participants = this.mapParticipants(newRequest.participants);
        newHearingRequest.other_information = newRequest.other_information;
        newHearingRequest.audio_recording_required = newRequest.audio_recording_required;
        newHearingRequest.endpoints = this.mapEndpoints(newRequest.endpoints);
        newHearingRequest.linked_participants = this.mapLinkedParticipants(newRequest.linked_participants);
        newHearingRequest.judiciary_participants = this.mapJudicialMemberDtoToJudiciaryParticipantRequest(newRequest.judiciaryParticipants);

        return newHearingRequest;
    }

    mapHearingDetailsResponseToHearingModel(response: HearingDetailsResponse): HearingModel {
        const hearing = new HearingModel();
        hearing.hearing_id = response.id;
        hearing.cases = this.mapCaseResponseToCaseModel(response.cases);
        hearing.hearing_type_name = response.hearing_type_name;
        hearing.hearing_type_code = response.hearing_type_code;
        hearing.case_type = response.case_type_name;
        hearing.scheduled_date_time = new Date(response.scheduled_date_time);
        hearing.scheduled_duration = response.scheduled_duration;
        hearing.court_name = response.hearing_venue_name;
        hearing.court_code = response.hearing_venue_code;
        hearing.court_room = response.hearing_room_name;
        hearing.participants = this.mapParticipantResponseToParticipantModel(response.participants);
        hearing.other_information = response.other_information;
        hearing.created_date = new Date(response.created_date);
        hearing.created_by = response.created_by;
        hearing.updated_date = new Date(response.updated_date);
        hearing.updated_by = response.updated_by;
        hearing.status = response.status;
        hearing.audio_recording_required = response.audio_recording_required;
        hearing.endpoints = this.mapEndpointResponseToEndpointModel(response.endpoints, response.participants);
        hearing.isConfirmed = Boolean(response.confirmed_date);
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

    mapCaseResponseToCaseModel(casesResponse: CaseResponse[]): CaseModel[] {
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

    mapJudicialMemberDtoToJudiciaryParticipantRequest(judicialMemberDtos: JudicialMemberDto[]): JudiciaryParticipantRequest[] {
        return judicialMemberDtos.map(judicialMemberDto => {
            const judiciaryParticipantRequest: JudiciaryParticipantRequest = new JudiciaryParticipantRequest({
                personal_code: judicialMemberDto.personalCode,
                display_name: judicialMemberDto.fullName,
                role: judicialMemberDto.roleCode
            });
            return judiciaryParticipantRequest;
        });
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
                participant.hearing_role_code = p.hearing_role_code;
                participant.representee = p.representee;
                participant.organisation_name = p.company;
                participants.push(participant);
            });
        }
        return participants;
    }

    mapEndpoints(endpointModel: EndpointModel[]): EndpointRequest[] {
        const eps: EndpointRequest[] = [];
        let endpoint: EndpointRequest;
        if (endpointModel && endpointModel.length > 0) {
            endpointModel.forEach(e => {
                endpoint = new EndpointRequest();
                endpoint.display_name = e.displayName;
                endpoint.defence_advocate_contact_email = e.defenceAdvocate;
                eps.push(endpoint);
            });
        }
        return eps;
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
                participant.hearing_role_code = p.hearing_role_code;
                participant.representee = p.representee;
                participant.company = p.organisation;
                participant.is_judge =
                    p.case_role_name === Constants.HearingRoles.Judge || p.hearing_role_code === Constants.HearingRoleCodes.Judge;
                participant.is_staff_member =
                    p.case_role_name === Constants.HearingRoles.StaffMember ||
                    p.hearing_role_code === Constants.HearingRoleCodes.StaffMember;
                participant.linked_participants = this.mapLinkedParticipantResponseToLinkedParticipantModel(p.linked_participants);
                participant.user_role_name = p.user_role_name;
                participants.push(participant);
            });
        }
        return participants;
    }

    mapLinkedParticipantResponseToLinkedParticipantModel(response: LinkedParticipantResponse[]): LinkedParticipantModel[] {
        const linkedParticipants: LinkedParticipantModel[] = [];
        let linkedParticipant: LinkedParticipantModel;
        if (response && response.length > 0) {
            response.forEach(p => {
                linkedParticipant = new LinkedParticipantModel();
                linkedParticipant.linkType = p.type;
                linkedParticipant.linkedParticipantId = p.linked_id;
                linkedParticipants.push(linkedParticipant);
            });
        }
        return linkedParticipants;
    }

    mapEndpointResponseToEndpointModel(response: EndpointResponse[], participants: ParticipantResponse[]): EndpointModel[] {
        const endpoints: EndpointModel[] = [];
        let endpoint: EndpointModel;
        if (response && response.length > 0) {
            response.forEach(e => {
                const defenceAdvocate = participants.find(p => p.id === e.defence_advocate_id);
                endpoint = new EndpointModel();
                endpoint.id = e.id;
                endpoint.displayName = e.display_name;
                endpoint.pin = e.pin;
                endpoint.sip = e.sip;
                endpoint.defenceAdvocate = defenceAdvocate?.contact_email;
                endpoints.push(endpoint);
            });
        }
        return endpoints;
    }

    mapLinkedParticipants(linkedParticipantModels: LinkedParticipantModel[] = []): LinkedParticipantRequest[] {
        return linkedParticipantModels.reduce((acc: LinkedParticipantRequest[], model: LinkedParticipantModel) => {
            const request = new LinkedParticipantRequest();
            request.participant_contact_email = model.participantEmail;
            request.linked_participant_contact_email = model.linkedParticipantEmail;
            request.type = model.linkType;
            acc.push(request);
            return acc;
        }, []);
    }

    getHearingById(hearingId: string): Observable<HearingDetailsResponse> {
        return this.bhClient.getHearingById(hearingId);
    }

    updateBookingStatus(hearingId: string, updateBookingStatus: UpdateBookingStatusRequest): Observable<UpdateBookingStatusResponse> {
        return this.bhClient.updateBookingStatus(hearingId, updateBookingStatus);
    }

    async getConferencePhoneNumber(isWelsh = false) {
        const conferencePhoneNumberKey = isWelsh ? this.conferencePhoneNumberWelshKey : this.conferencePhoneNumberKey;

        const savedConferencePhoneNumber = sessionStorage.getItem(conferencePhoneNumberKey);
        if (savedConferencePhoneNumber === null) {
            const response = await lastValueFrom(this.bhClient.getConfigSettings());
            const conferencePhoneNumberValue = isWelsh ? response.conference_phone_number_welsh : response.conference_phone_number;
            sessionStorage.setItem(conferencePhoneNumberKey, conferencePhoneNumberValue);
            return isWelsh ? response.conference_phone_number_welsh : response.conference_phone_number;
        } else {
            return savedConferencePhoneNumber;
        }
    }

    getTelephoneConferenceId(hearingId: string): Observable<PhoneConferenceResponse> {
        return this.bhClient.getTelephoneConferenceIdById(hearingId);
    }

    canAddUser(username: string): boolean {
        return this.modelHearing.participants.every(x => x.username.toLowerCase() !== username.toLowerCase());
    }

    canAddJudge(username: string): boolean {
        return !this.modelHearing.participants.some(
            x => x.username?.toLowerCase() === username.toLowerCase() && this.judiciaryRoles.includes(x.hearing_role_name)
        );
    }

    getJudge(): ParticipantModel {
        return this.modelHearing.participants.find(x => x.is_judge);
    }

    isConferenceClosed(): boolean {
        return this.modelHearing.status === BookingStatus.Created && this.modelHearing.telephone_conference_id === '';
    }

    isHearingAboutToStart(): boolean {
        if (this.modelHearing.scheduled_date_time && this.modelHearing.isConfirmed) {
            const currentDateTime = new Date().getTime();
            const difference = moment(this.modelHearing.scheduled_date_time).diff(moment(currentDateTime), 'minutes');
            return difference < 30;
        } else {
            return false;
        }
    }

    getAllocatedCsoForHearing(hearingId: string): Observable<AllocatedCsoResponse> {
        return this.bhClient.getAllocationForHearing(hearingId);
    }

    addJudiciaryJudge(judicialMember: JudicialMemberDto) {
        const judgeIndex = this.modelHearing.judiciaryParticipants.findIndex(holder => holder.roleCode === 'Judge');

        if (judgeIndex !== -1) {
            // Judge exists, replace or add entry
            this.modelHearing.judiciaryParticipants[judgeIndex] = judicialMember;
        } else {
            // Judge does not exist, add entry
            this.modelHearing.judiciaryParticipants.push(judicialMember);
        }
    }

    removeJudiciaryJudge() {
        const judgeIndex = this.modelHearing.judiciaryParticipants.findIndex(holder => holder.roleCode === 'Judge');
        if (judgeIndex !== -1) {
            this.modelHearing.judiciaryParticipants.splice(judgeIndex, 1);
        }
    }

    addJudiciaryPanelMember(judicialMember: JudicialMemberDto) {
        const panelMemberIndex = this.modelHearing.judiciaryParticipants.findIndex(
            holder => holder.personalCode === judicialMember.personalCode
        );
        if (panelMemberIndex !== -1) {
            this.modelHearing.judiciaryParticipants[panelMemberIndex] = judicialMember;
        } else {
            this.modelHearing.judiciaryParticipants.push(judicialMember);
        }
    }

    removeJudiciaryParticipant(participantEmail: string) {
        const index = this.modelHearing.judiciaryParticipants.findIndex(judicialMember => judicialMember.email === participantEmail);
        if (index !== -1) {
            this.modelHearing.judiciaryParticipants.splice(index, 1);
        }
    }
}
