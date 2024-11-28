import { Injectable } from '@angular/core';
import { combineLatest, firstValueFrom, lastValueFrom, Observable } from 'rxjs';
import {
    BHClient,
    BookHearingRequest,
    BookingDetailsRequest,
    BookingStatus,
    CancelMultiDayHearingRequest,
    CaseRequest,
    CaseResponse,
    EditCaseRequest,
    EditEndpointRequest,
    EditHearingRequest,
    EditMultiDayHearingRequest,
    EditParticipantRequest,
    EndpointRequest,
    EndpointResponse,
    HearingDetailsResponse,
    HearingRoleResponse,
    HearingTypeResponse,
    HearingVenueResponse,
    JudiciaryParticipantRequest,
    LinkedParticipant,
    LinkedParticipantRequest,
    LinkedParticipantResponse,
    MultiHearingRequest,
    ParticipantRequest,
    ParticipantResponse,
    PhoneConferenceResponse,
    SpecialMeasureScreeningRequest,
    UpdateBookingStatusResponse,
    UpdateHearingInGroupRequest
} from './clients/api-client';
import { HearingModel } from '../common/model/hearing.model';
import { CaseModel } from '../common/model/case.model';
import { ParticipantModel } from '../common/model/participant.model';
import { EndpointModel } from '../common/model/endpoint.model';
import { LinkedParticipantModel } from '../common/model/linked-participant.model';
import { Constants } from '../common/constants';
import * as moment from 'moment';
import { JudicialMemberDto } from '../booking/judicial-office-holders/models/add-judicial-member.model';
import { map, shareReplay } from 'rxjs/operators';
import { InterpreterSelectedDto } from '../booking/interpreter-form/interpreter-selected.model';
import { mapScreeningResponseToScreeningDto, ScreeningDto } from '../booking/screening/screening.model';
import { ReferenceDataService } from './reference-data.service';

@Injectable({
    providedIn: 'root'
})
export class VideoHearingsService {
    private readonly newRequestKey: string;
    private readonly bookingHasChangesKey: string;
    private readonly conferencePhoneNumberKey: string;
    private readonly conferencePhoneNumberWelshKey: string;
    private readonly vhoNonAvailabiltiesHaveChangesKey: string;
    private readonly totalHearingsCountThreshold: number = 40;

    private readonly venues$: Observable<HearingVenueResponse[]>;
    private readonly hearingTypes$: Observable<HearingTypeResponse[]>;

    private modelHearing: HearingModel;
    private readonly judiciaryRoles = Constants.JudiciaryRoles;

    constructor(private readonly bhClient: BHClient, private readonly referenceDataService: ReferenceDataService) {
        this.newRequestKey = 'bh-newRequest';
        this.bookingHasChangesKey = 'bookingHasChangesKey';
        this.conferencePhoneNumberKey = 'conferencePhoneNumberKey';
        this.conferencePhoneNumberWelshKey = 'conferencePhoneNumberWelshKey';
        this.vhoNonAvailabiltiesHaveChangesKey = 'vhoNonAvailabiltiesHaveChangesKey';

        this.checkForExistingHearing();
        this.venues$ = this.referenceDataService.getCourts().pipe(shareReplay(1));
        this.hearingTypes$ = this.referenceDataService.getHearingTypes();
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

    setBookingHasChanged() {
        sessionStorage.setItem(this.bookingHasChangesKey, 'true');
    }

    unsetBookingHasChanged() {
        sessionStorage.removeItem(this.bookingHasChangesKey);
    }

    setVhoNonAvailabiltiesHaveChanged() {
        sessionStorage.setItem(this.vhoNonAvailabiltiesHaveChangesKey, 'true');
    }

    unsetVhoNonAvailabiltiesHaveChanged() {
        sessionStorage.removeItem(this.vhoNonAvailabiltiesHaveChangesKey);
    }

    cancelVhoNonAvailabiltiesRequest() {
        sessionStorage.removeItem(this.vhoNonAvailabiltiesHaveChangesKey);
    }

    /**
     * @deprecated This method is deprecated and will be removed in future versions.
     * Please use the new method `getNewHearingTypes` in `ReferenceDataService` instead.
     */
    getHearingTypes(): Observable<HearingTypeResponse[]> {
        return this.bhClient.getHearingTypes();
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
            localRequest.hearing_venue_id > 0
        );
    }

    updateHearingRequest(updatedRequest: HearingModel) {
        this.modelHearing = updatedRequest;
        const localRequest = JSON.stringify(this.modelHearing);
        sessionStorage.setItem(this.newRequestKey, localRequest);
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

        if (newRequest.isMultiDayEdit) {
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

    updateMultiDayHearing(booking: HearingModel): Observable<HearingDetailsResponse> {
        const request = this.mapExistingHearingToEditMultiDayHearingRequest(booking);
        return this.bhClient.editMultiDayHearing(booking.hearing_id, request);
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
        if (booking.judiciaryParticipants?.length > 0) {
            hearing.judiciary_participants = this.mapJudicialMemberDtoToJudiciaryParticipantRequest(booking.judiciaryParticipants);
        }
        return hearing;
    }

    mapExistingHearingToEditMultiDayHearingRequest(booking: HearingModel): EditMultiDayHearingRequest {
        const editMultiDayRequest = new EditMultiDayHearingRequest();

        const editHearingRequest = this.mapExistingHearing(booking);

        editMultiDayRequest.scheduled_duration = editHearingRequest.scheduled_duration;
        editMultiDayRequest.hearing_venue_code = editHearingRequest.hearing_venue_code;
        editMultiDayRequest.hearing_venue_name = editHearingRequest.hearing_venue_name;
        editMultiDayRequest.hearing_room_name = editHearingRequest.hearing_room_name;
        editMultiDayRequest.other_information = editHearingRequest.other_information;
        editMultiDayRequest.case_number = editHearingRequest.case.number;
        editMultiDayRequest.audio_recording_required = editHearingRequest.audio_recording_required;
        editMultiDayRequest.participants = editHearingRequest.participants;
        editMultiDayRequest.judiciary_participants = editHearingRequest.judiciary_participants;
        editMultiDayRequest.endpoints = editHearingRequest.endpoints;
        editMultiDayRequest.update_future_days = booking.isMultiDayEdit;
        editMultiDayRequest.hearings_in_group = booking.hearingsInGroup.map(
            hearing =>
                new UpdateHearingInGroupRequest({
                    hearing_id: hearing.hearing_id,
                    scheduled_date_time: hearing.scheduled_date_time
                })
        );

        return editMultiDayRequest;
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
        editParticipant.external_reference_id = participant.externalReferenceId;
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
        editParticipant.interpreter_language_code = this.mapInterpreterLanguageCode(participant.interpretation_language);
        editParticipant.screening_requirements = this.mapScreeningRequirementDtoToRequest(participant.screening);
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
        editEndpoint.external_reference_id = endpoint.externalReferenceId;
        editEndpoint.display_name = endpoint.displayName;
        editEndpoint.defence_advocate_contact_email = endpoint.defenceAdvocate;
        editEndpoint.interpreter_language_code = this.mapInterpreterLanguageCode(endpoint.interpretationLanguage);
        editEndpoint.screening_requirements = this.mapScreeningRequirementDtoToRequest(endpoint.screening);
        return editEndpoint;
    }

    mapHearing(newRequest: HearingModel): BookingDetailsRequest {
        const newHearingRequest = new BookingDetailsRequest();
        newHearingRequest.cases = this.mapCases(newRequest);
        newHearingRequest.case_type_service_id = newRequest.case_type_service_id;
        newHearingRequest.scheduled_date_time = new Date(newRequest.scheduled_date_time);
        newHearingRequest.scheduled_duration = newRequest.scheduled_duration;
        newHearingRequest.hearing_venue_code = newRequest.court_code;
        newHearingRequest.hearing_room_name = newRequest.court_room;
        newHearingRequest.participants = this.mapParticipants(newRequest.participants);
        newHearingRequest.other_information = newRequest.other_information;
        newHearingRequest.audio_recording_required = newRequest.audio_recording_required;
        newHearingRequest.endpoints = this.mapEndpoints(newRequest.endpoints);
        newHearingRequest.linked_participants = this.mapLinkedParticipants(newRequest.linked_participants);
        newHearingRequest.judiciary_participants = this.mapJudicialMemberDtoToJudiciaryParticipantRequest(newRequest.judiciaryParticipants);
        newHearingRequest.conference_supplier = newRequest.supplier;

        return newHearingRequest;
    }

    mapHearingDetailsResponseToHearingModel(response: HearingDetailsResponse): HearingModel {
        const hearing = new HearingModel();
        hearing.hearing_id = response.id;
        hearing.cases = this.mapCaseResponseToCaseModel(response.cases);
        hearing.scheduled_date_time = new Date(response.scheduled_date_time);
        hearing.scheduled_duration = response.scheduled_duration;
        hearing.court_code = response.hearing_venue_code;
        hearing.court_name = response.hearing_venue_name;
        hearing.court_room = response.hearing_room_name;
        hearing.case_type = response.case_type_name;
        hearing.case_type_service_id = response.service_id;
        hearing.participants = this.mapParticipantResponseToParticipantModel(response.participants);
        hearing.other_information = response.other_information;
        hearing.created_date = new Date(response.created_date);
        hearing.created_by = response.created_by;
        hearing.updated_date = new Date(response.updated_date);
        hearing.updated_by = response.updated_by;
        hearing.status = response.status;
        hearing.audio_recording_required = response.audio_recording_required;
        hearing.endpoints = this.mapEndpointResponseToEndpointModel(response.endpoints, response.participants);
        hearing.judiciaryParticipants = response.judiciary_participants?.map(judiciaryParticipant =>
            JudicialMemberDto.fromJudiciaryParticipantResponse(judiciaryParticipant)
        );
        hearing.isConfirmed = Boolean(response.confirmed_date);
        hearing.isMultiDay = response.group_id !== null;
        hearing.multiDayHearingLastDayScheduledDateTime = response.multi_day_hearing_last_day_scheduled_date_time;
        hearing.originalScheduledDateTime = hearing.scheduled_date_time;
        hearing.hearingsInGroup = response.hearings_in_group?.map(hearingInGroup =>
            this.mapHearingDetailsResponseToHearingModel(hearingInGroup)
        );
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
                display_name: judicialMemberDto.displayName,
                role: judicialMemberDto.roleCode,
                optional_contact_email: judicialMemberDto.optionalContactEmail,
                optional_contact_telephone: judicialMemberDto.optionalContactNumber,
                interpreter_language_code: this.mapInterpreterLanguageCode(judicialMemberDto.interpretationLanguage)
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
                participant.external_reference_id = p.externalReferenceId;
                participant.title = p.title;
                participant.first_name = p.first_name;
                participant.middle_names = p.middle_names;
                participant.last_name = p.last_name;
                participant.username = p.username;
                participant.display_name = p.display_name;
                participant.contact_email = p.email;
                participant.telephone_number = p.phone;
                participant.hearing_role_code = p.hearing_role_code;
                participant.representee = p.representee;
                participant.organisation_name = p.company;
                participant.interpreter_language_code = this.mapInterpreterLanguageCode(p.interpretation_language);
                participant.screening_requirements = this.mapScreeningRequirementDtoToRequest(p.screening);
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
                endpoint.interpreter_language_code = this.mapInterpreterLanguageCode(e.interpretationLanguage);
                endpoint.screening_requirements = this.mapScreeningRequirementDtoToRequest(e.screening);
                endpoint.external_reference_id = e.externalReferenceId;
                eps.push(endpoint);
            });
        }
        return eps;
    }

    mapScreeningRequirementDtoToRequest(screeningDto: ScreeningDto): SpecialMeasureScreeningRequest {
        if (!screeningDto) {
            return null;
        }
        if (screeningDto && screeningDto.measureType === 'All') {
            return new SpecialMeasureScreeningRequest({ screen_all: true });
        }
        return new SpecialMeasureScreeningRequest({
            screen_all: false,
            screen_from_external_reference_ids: screeningDto.protectFrom.map(x => x.externalReferenceId)
        });
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
                participant.hearing_role_name = p.hearing_role_name;
                participant.hearing_role_code = p.hearing_role_code;
                participant.representee = p.representee;
                participant.company = p.organisation;
                participant.is_judge = p.user_role_name === Constants.UserRoles.Judge;
                participant.is_staff_member = p.user_role_name === Constants.UserRoles.StaffMember;
                participant.linked_participants = this.mapLinkedParticipantResponseToLinkedParticipantModel(p.linked_participants);
                participant.user_role_name = p.user_role_name;
                participant.interpretation_language = InterpreterSelectedDto.fromAvailableLanguageResponse(p.interpreter_language);
                participant.screening = mapScreeningResponseToScreeningDto(p.screening_requirement);
                if (p.external_reference_id) {
                    // only override the external reference id if it is not null else ParticipantModel will initialise to a UUID in the ctor
                    participant.externalReferenceId = p.external_reference_id;
                }
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
                endpoint = new EndpointModel(e.external_reference_id);
                endpoint.id = e.id;
                endpoint.displayName = e.display_name;
                endpoint.pin = e.pin;
                endpoint.sip = e.sip;
                endpoint.defenceAdvocate = defenceAdvocate?.contact_email;
                endpoint.interpretationLanguage = InterpreterSelectedDto.fromAvailableLanguageResponse(e.interpreter_language);
                endpoint.screening = mapScreeningResponseToScreeningDto(e.screening_requirement);
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

    mapInterpreterLanguageCode(interpreterLanguage: InterpreterSelectedDto): string {
        if (interpreterLanguage == null) {
            return null;
        }

        return interpreterLanguage.spokenLanguageCode || interpreterLanguage.signLanguageCode;
    }

    getHearingById(hearingId: string): Observable<HearingDetailsResponse> {
        const hearingById$ = this.bhClient.getHearingById(hearingId);
        return combineLatest([hearingById$, this.venues$, this.hearingTypes$]).pipe(
            map(([hearing, venues, hearingTypes]) => {
                const venue = venues.find(v => v.code === hearing.hearing_venue_code);
                if (venue) {
                    hearing.hearing_venue_name = venue.name;
                }
                const hearingType = hearingTypes.find(ht => ht.service_id === hearing.service_id);
                if (hearingType) {
                    hearing.case_type_name = hearingType.group;
                }
                return hearing;
            })
        );
    }

    cancelBooking(hearingId: string, reason: string): Observable<UpdateBookingStatusResponse> {
        return this.bhClient.cancelBooking(hearingId, reason);
    }

    cancelMultiDayBooking(hearingId: string, reason: string, updateFutureDays: boolean): Observable<UpdateBookingStatusResponse> {
        const request = new CancelMultiDayHearingRequest({ cancel_reason: reason, update_future_days: updateFutureDays });
        return this.bhClient.cancelMultiDayHearing(hearingId, request);
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

    addJudiciaryJudge(judicialMember: JudicialMemberDto) {
        const judgeIndex = this.modelHearing.judiciaryParticipants.findIndex(holder => holder.roleCode === 'Judge');
        //Hearings booked with V1 of the API will not have a judiciaryParticipants array
        const participantJudgeIndex = this.modelHearing.participants.findIndex(holder => holder.user_role_name === 'Judge');
        if (participantJudgeIndex !== -1) {
            //remove judge from participants
            this.modelHearing.participants.splice(participantJudgeIndex, 1);
        }
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
        const index =
            this.modelHearing?.judiciaryParticipants?.findIndex(judicialMember => judicialMember.email === participantEmail) ?? -1;
        if (index !== -1) {
            this.modelHearing.judiciaryParticipants.splice(index, 1);
        }
    }

    isTotalHearingMoreThanThreshold(): boolean {
        const totalHearings = this.modelHearing.hearingsInGroup.length;
        return totalHearings >= this.totalHearingsCountThreshold;
    }

    isBookingServiceDegraded(): Observable<boolean> {
        return this.bhClient.getBookingQueueState().pipe(map(response => response.state?.toLowerCase() === 'degraded'));
    }
}
