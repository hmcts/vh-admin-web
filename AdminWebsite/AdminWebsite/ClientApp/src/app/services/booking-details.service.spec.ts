import { TestBed, inject } from '@angular/core/testing';
import { BookingDetailsService } from './booking-details.service';
import { HearingResponse, CaseResponse, CourtResponse, ParticipantResponse} from '../services/clients/api-client';
describe('bookings service', () => {
  let service: BookingDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookingDetailsService]
    });

    service = TestBed.get(BookingDetailsService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });


  it('should be created', inject([BookingDetailsService], (service: BookingDetailsService) => {
    expect(service).toBeTruthy();
  }));

  it('should map response to model', () => {
    let hearingResponse = new ResponseTestData().getHearingResponseTestData();
    let model = service.mapBooking(hearingResponse);
    expect(model).toBeTruthy();
    expect(model.HearingId).toBe(1)
    expect(model.CourtRoom).toBe("Room 22");
    expect(model.Duration).toBe(125);
    expect(model.CourtAddress).toBe("Coronation street");
    expect(model.HearingCaseName).toBe("Smith vs Donner");
    expect(model.HearingCaseNumber).toBe("XX3456234565");
    expect(model.HearingType).toBe("Tax");
    expect(model.StartTime).toEqual(new Date('2019-10-22 13:58:40.3730067'));
    expect(model.CreatedBy).toBe('someone@email.address');
    expect(model.CreatedDate).toEqual(new Date('2019-10-22 13:58:40.3730067'));
    expect(model.LastEditBy).toBe('updatedby@email.address');
    expect(model.LastEditDate).toEqual(new Date('2019-10-22 13:58:40.3730067'));

  });

  it('should map response to model and set to empty string case,court, createdBy and lasteditBy if not provided', () => {
    let hearingResponse = new ResponseTestData().getHearingResponseTestData();
    hearingResponse.cases = null;
    hearingResponse.court = null;
    hearingResponse.created_by = null;
    hearingResponse.updated_by = null;

    let model = service.mapBooking(hearingResponse);
    expect(model).toBeTruthy();
    expect(model.CourtRoom).toBe("");
    expect(model.CourtAddress).toBe("");
    expect(model.HearingCaseName).toBe("");
    expect(model.HearingCaseNumber).toBe("");
    expect(model.CreatedBy).toBe('');
    expect(model.LastEditBy).toBe('');
  });

  it('should map participants and judges', () => {
    let hearingResponse = new ResponseTestData().getHearingResponseTestData();
      let model = service.mapBookingParticipants(hearingResponse)
    expect(model).toBeTruthy();
    expect(model.participants.length).toBe(1);
    expect(model.judges.length).toBe(1);

    expect(model.participants[0].ParticipantId).toBe(1);
    expect(model.participants[0].Role).toBe('Citizen');

    expect(model.judges[0].ParticipantId).toBe(2);
    expect(model.judges[0].Role).toBe('Judge');
  });
  
});

export class ResponseTestData {
  getHearingResponseTestData(): HearingResponse {
    let response = new HearingResponse();
    let caseHearing = new CaseResponse();
    caseHearing.name = 'Smith vs Donner';
    caseHearing.number = 'XX3456234565';
    response.cases = [];
    response.cases.push(caseHearing);
    response.hearing_type = 'Tax';
    response.id = 1;
    response.scheduled_date_time = new Date('2019-10-22 13:58:40.3730067');
    response.scheduled_duration = 125;
    let court = new CourtResponse();
    court.room = 'Room 22';
    court.address = "Coronation street";
    response.court = court;
    response.created_by = 'someone@email.address';
    response.created_date = new Date('2019-10-22 13:58:40.3730067');
    response.updated_by = 'updatedby@email.address';
    response.updated_date = new Date('2019-10-22 13:58:40.3730067');

    let par1 = new ParticipantResponse();
    par1.id = 1;
    par1.title = 'Mr';
    par1.first_name = 'Jo';
    par1.last_name = 'Smith';
    par1.participant_role = 'Citizen';
    par1.username = 'username@email.address';

    let par2 = new ParticipantResponse();
    par2.id = 2;
    par2.title = 'Mr';
    par2.first_name = 'Judge';
    par2.last_name = 'Smith';
    par2.participant_role = 'Judge';
    par2.username = 'usernamejudge@email.address';
    response.participants = [];
    response.participants.push(par1);
    response.participants.push(par2);
    return response;
  }
}