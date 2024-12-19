import { TestBed } from '@angular/core/testing';
import { BookingDetailsService } from './booking-details.service';
import { HearingDetailsResponse, CaseResponse, ParticipantResponse, EndpointResponse } from './clients/api-client';

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
        expect(model.hearing_id).toBe('1');
        expect(model.scheduled_duration).toBe(125);
        expect(model.court_room).toBe('777');
        expect(model.case.name).toBe('Smith vs Donner');
        expect(model.case.number).toBe('XX3456234565');
        expect(model.scheduled_date_time).toEqual(new Date('2019-10-22 13:58:40.3730067'));
        expect(model.created_by).toBe('stub.response@hmcts.net');
        expect(model.updated_by).toBe('stub.response@hmcts.net');
        expect(model.confirmedBy).toBe('stub.response@hmcts.net');
        expect(model.audio_recording_required).toBe(true);
        expect(model.groupId).toBe('123');
        expect(model.multiDayHearingLastDayScheduledDateTime).toEqual(new Date('2019-10-23 13:58:40.3730067'));
        expect(model.allocatedTo).toBe(hearingResponse.allocated_to_username);
    });

    it('should map response to model and set to empty string case,court, createdBy and lasteditBy if not provided', () => {
        const hearingResponse = ResponseTestData.getHearingResponseTestData();
        hearingResponse.cases = null;

        const model = service.mapBooking(hearingResponse);
        expect(model).toBeTruthy();
        expect(model.case.name).toBe('');
        expect(model.case.number).toBe('');
    });
});
