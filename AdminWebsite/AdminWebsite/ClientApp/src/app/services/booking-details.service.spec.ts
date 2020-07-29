import { TestBed } from '@angular/core/testing';
import { BookingDetailsService } from './booking-details.service';
import { HearingDetailsResponse, CaseResponse, ParticipantResponse } from './clients/api-client';

export class ResponseTestData {
  static getHearingResponseTestData(): HearingDetailsResponse {
    const response = new HearingDetailsResponse();
    const caseHearing = new CaseResponse();
    caseHearing.name = 'Smith vs Donner';
    caseHearing.number = 'XX3456234565';
    response.cases = [];
    response.cases.push(caseHearing);
    response.hearing_type_name = 'Tax';
    response.id = '1';
    response.scheduled_date_time = new Date('2019-10-22 13:58:40.3730067');
    response.scheduled_duration = 125;
    response.hearing_venue_name = 'Coronation Street';
    response.case_type_name = 'Civil Money Claims';
    response.hearing_type_name = 'Application to Set Judgment Aside';
    response.other_information = 'some note';
    response.hearing_room_name = '777';
    response.created_date = new Date('2019-10-22 13:58:40.3730067');
    response.created_by = 'stub.response@madeupemail.com';
    response.updated_by = 'stub.response@madeupemail.com';
    response.updated_date = new Date('2019-10-22 13:58:40.3730067');
    response.audio_recording_required = true;

    const par1 = new ParticipantResponse();
    par1.id = '1';
    par1.title = 'Mr';
    par1.first_name = 'Jo';
    par1.last_name = 'Smith';
    par1.user_role_name = 'Citizen';
    par1.username = 'username@email.address';

    const par2 = new ParticipantResponse();
    par2.id = '2';
    par2.title = 'Mr';
    par2.first_name = 'Judge';
    par2.last_name = 'Smith';
    par2.user_role_name = 'Judge';
    par2.username = 'usernamejudge@email.address';
    response.participants = [];
    response.participants.push(par1);
    response.participants.push(par2);
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
    expect(model.CourtAddress).toBe('Coronation Street');
    expect(model.CourtRoom).toBe('777');
    expect(model.HearingCaseName).toBe('Smith vs Donner');
    expect(model.HearingCaseNumber).toBe('XX3456234565');
    expect(model.HearingType).toBe('Application to Set Judgment Aside');
    expect(model.StartTime).toEqual(new Date('2019-10-22 13:58:40.3730067'));
    expect(model.CreatedBy).toBe('stub.response@madeupemail.com');
    expect(model.LastEditBy).toBe('stub.response@madeupemail.com');
    expect(model.AudioRecordingRequired).toBe(true);
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

    expect(model.judges[0].ParticipantId).toBe('2');
    expect(model.judges[0].UserRoleName).toBe('Judge');
  });

});

