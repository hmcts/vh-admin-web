import { TestBed } from '@angular/core/testing';
import { BookingDetailsService } from './booking-details.service';
import {
    HearingDetailsResponse,
    CaseResponse,
    ParticipantResponse,
    EndpointResponse,
    LinkedParticipantResponse,
    LinkedParticipantType
} from './clients/api-client';

export class ResponseTestData {
    static getHearingResponseTestData(): HearingDetailsResponse {
        const response = new HearingDetailsResponse();
        const caseHearing = new CaseResponse();
        caseHearing.name = 'Smith vs Donner';
        caseHearing.number = 'XX3456234565';
        response.cases = [];
        response.cases.push(caseHearing);
        response.id = '1';
        response.scheduled_date_time = new Date('2019-10-22 13:58:40.3730067');
        response.scheduled_duration = 125;
        response.other_information = 'some note';
        response.hearing_room_name = '777';
        response.created_date = new Date('2019-10-22 13:58:40.3730067');
        response.created_by = 'stub.response@hmcts.net';
        response.updated_by = 'stub.response@hmcts.net';
        response.updated_date = new Date('2019-10-22 13:58:40.3730067');
        response.confirmed_by = 'stub.response@hmcts.net';
        response.confirmed_date = new Date('2019-10-22 13:58:40.3730067');
        response.audio_recording_required = true;
        response.group_id = '123';
        response.multi_day_hearing_last_day_scheduled_date_time = new Date('2019-10-23 13:58:40.3730067');
        response.allocated_to_username = 'allocated-to@email.com';

        const par1 = new ParticipantResponse();
        par1.id = '1';
        par1.title = 'Mr';
        par1.first_name = 'Jo';
        par1.last_name = 'Smith';
        par1.user_role_name = 'Citizen';
        par1.username = 'username@hmcts.net';
        par1.telephone_number = '123456789';
        par1.hearing_role_name = 'Litigant in Person';

        const par2 = new ParticipantResponse();
        par2.id = '2';
        par2.title = 'Mr';
        par2.first_name = 'Judge';
        par2.last_name = 'Smith';
        par2.user_role_name = 'Judge';
        par2.username = 'usernamejudge@hmcts.net';
        par2.hearing_role_name = 'Judge';

        response.participants = [];
        response.participants.push(par1);
        response.participants.push(par2);

        const endpoint1 = new EndpointResponse();
        endpoint1.display_name = 'test endpoint 1';
        endpoint1.sip = '2213';
        endpoint1.pin = '2323';
        endpoint1.id = '022f5e0c-696d-43cf-6fe0-08d846dbdb21';
        response.endpoints = [];
        response.endpoints.push(endpoint1);

        response.judiciary_participants = [];
        return response;
    }
}

describe('booking details service', () => {
    let service: BookingDetailsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [BookingDetailsService]
        });

        service = TestBed.inject(BookingDetailsService);
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should map response to model', () => {
        const hearingResponse = ResponseTestData.getHearingResponseTestData();
        const model = service.mapBooking(hearingResponse);
        expect(model).toBeTruthy();
        expect(model.HearingId).toBe('1');
        expect(model.Duration).toBe(125);
        expect(model.CourtRoom).toBe('777');
        expect(model.HearingCaseName).toBe('Smith vs Donner');
        expect(model.HearingCaseNumber).toBe('XX3456234565');
        expect(model.StartTime).toEqual(new Date('2019-10-22 13:58:40.3730067'));
        expect(model.CreatedBy).toBe('stub.response@hmcts.net');
        expect(model.LastEditBy).toBe('stub.response@hmcts.net');
        expect(model.ConfirmedBy).toBe('stub.response@hmcts.net');
        expect(model.AudioRecordingRequired).toBe(true);
        expect(model.GroupId).toBe('123');
        expect(model.MultiDayHearingLastDayScheduledDateTime).toEqual(new Date('2019-10-23 13:58:40.3730067'));
        expect(model.AllocatedTo).toBe(hearingResponse.allocated_to_username);
    });

    it('should map response to model and set to empty string case,court, createdBy and lasteditBy if not provided', () => {
        const hearingResponse = ResponseTestData.getHearingResponseTestData();
        hearingResponse.cases = null;

        const model = service.mapBooking(hearingResponse);
        expect(model).toBeTruthy();
        expect(model.HearingCaseName).toBe('');
        expect(model.HearingCaseNumber).toBe('');
    });

    it('should map participants and judges', () => {
        const hearingResponse = ResponseTestData.getHearingResponseTestData();
        const model = service.mapBookingParticipants(hearingResponse);
        expect(model).toBeTruthy();
        expect(model.participants.length).toBe(1);
        expect(model.judges.length).toBe(1);

        expect(model.participants[0].ParticipantId).toBe('1');
        expect(model.participants[0].UserRoleName).toBe('Citizen');
        expect(model.participants[0].HearingRoleName).toBe('Litigant in Person');
        expect(model.participants[0].Phone).toBe('123456789');

        expect(model.judges[0].ParticipantId).toBe('2');
        expect(model.judges[0].UserRoleName).toBe('Judge');
        expect(model.judges[0].HearingRoleName).toBe('Judge');
        expect(model.judges[0].Phone).toBeFalsy();
    });

    it('it should map the endpoints', () => {
        const hearingResponse = ResponseTestData.getHearingResponseTestData();
        const model = service.mapBookingEndpoints(hearingResponse);
        expect(model).toBeTruthy();
        expect(model[0].displayName).toBe('test endpoint 1');
        expect(model[0].pin).toBe('2323');
        expect(model[0].sip).toBe('2213');
    });

    it('should map the interpretee name if the hearing role is interpreter', () => {
        const response = new HearingDetailsResponse();
        const caseHearing = new CaseResponse();
        caseHearing.name = 'Smith vs Donner';
        caseHearing.number = 'XX3456234565';
        response.cases = [];
        response.cases.push(caseHearing);
        response.id = '1';
        response.scheduled_date_time = new Date('2019-10-22 13:58:40.3730067');
        response.scheduled_duration = 125;
        response.other_information = 'some note';
        response.hearing_room_name = '777';
        response.created_date = new Date('2019-10-22 13:58:40.3730067');
        response.created_by = 'stub.response@madeupemail.com';
        response.updated_by = 'stub.response@madeupemail.com';
        response.updated_date = new Date('2019-10-22 13:58:40.3730067');
        response.confirmed_by = 'stub.response@madeupemail.com';
        response.confirmed_date = new Date('2019-10-22 13:58:40.3730067');
        response.audio_recording_required = true;

        const par1 = new ParticipantResponse();
        par1.id = '1';
        par1.title = 'Mr';
        par1.first_name = 'Judge';
        par1.last_name = 'James';
        par1.user_role_name = 'Judge';
        par1.username = 'judge.james@email.com';
        par1.telephone_number = '123456789';
        par1.hearing_role_name = 'Judge';
        par1.linked_participants = [];
        const par2 = new ParticipantResponse();
        par2.id = '2';
        par2.title = 'Mr';
        par2.first_name = 'Oliver';
        par2.last_name = 'Interpretee';
        par2.user_role_name = 'Citizen';
        par2.username = 'oliver.interpretee@email.com';
        par2.telephone_number = '123456789';
        par2.hearing_role_name = 'litigant in person';
        par2.display_name = 'Oliver Interpretee';
        let linkedParticipant = new LinkedParticipantResponse();
        linkedParticipant.linked_id = '3';
        linkedParticipant.type = LinkedParticipantType.Interpreter;
        par2.linked_participants = [];
        par2.linked_participants.push(linkedParticipant);
        const par3 = new ParticipantResponse();
        par3.id = '3';
        par3.title = 'Mr';
        par3.first_name = 'Oliver';
        par3.last_name = 'Interpreter';
        par3.user_role_name = 'Citizen';
        par3.username = 'oliver.interpreter@email.com';
        par3.telephone_number = '123456789';
        par3.hearing_role_name = 'interpreter';
        linkedParticipant = new LinkedParticipantResponse();
        linkedParticipant.linked_id = '2';
        linkedParticipant.type = LinkedParticipantType.Interpreter;
        par3.linked_participants = [];
        par3.linked_participants.push(linkedParticipant);

        response.participants = [];
        response.participants.push(par1);
        response.participants.push(par2);
        response.participants.push(par3);

        response.judiciary_participants = [];

        const model = service.mapBookingParticipants(response);
        expect(model).toBeTruthy();
        expect(model.participants[0].Interpretee).toBe('');
        expect(model.participants[1].Interpretee).toBe('Oliver Interpretee');
    });
});
