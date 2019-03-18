import { TestBed, inject } from '@angular/core/testing';
import { ParticipantService } from './participant.service';
import { HttpClientModule } from '@angular/common/http';
import { CaseAndHearingRolesResponse } from '../../services/clients/api-client';
import { PartyModel } from '../../common/model/party.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { HearingModel } from '../../common/model/hearing.model';

describe('ParticipantService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [ParticipantService]
    });
  });

  it('should be created', inject([ParticipantService], (service: ParticipantService) => {
    expect(service).toBeTruthy();
  }));
  it('should map roles to party model array', inject([ParticipantService], (service: ParticipantService) => {
    const response = new CaseAndHearingRolesResponse();
    response.name = 'Defendant';
    response.hearing_roles = ['Defendant LIP'];
    const responses: CaseAndHearingRolesResponse[] = [];
    responses.push(response);

    var models = service.mapParticipantsRoles(responses);
    expect(models).toBeTruthy();
    expect(models.length).toBe(1);
    expect(models[0].name).toBe('Defendant');
    expect(models[0].hearingRoles.length).toBe(1);
    expect(models[0].hearingRoles[0]).toBe('Defendant LIP');
  }));
  it('should return empty party model array', inject([ParticipantService], (service: ParticipantService) => {
    const responses: CaseAndHearingRolesResponse[] = [];
    var models = service.mapParticipantsRoles(responses);
    expect(models).toBeTruthy();
    expect(models.length).toBe(0);
  }));
  it('should check email duplication and return false, no duplicated participant emails found', inject([ParticipantService], (service: ParticipantService) => {
    const part1 = new ParticipantModel();
    part1.email = 'aa@aa.aa';
    const participants: ParticipantModel[] = [];
    participants.push(part1);
    var result = service.checkDuplication('bb@bb.bb', participants);
    expect(result).toBeFalsy();
  }));
  it('should check email duplication and return false, no participants exists', inject([ParticipantService], (service: ParticipantService) => {
    const participants: ParticipantModel[] = [];
    var result = service.checkDuplication('bb@bb.bb', participants);
    expect(result).toBeFalsy();
  }));
  
  it('should throw exception if email is invalid', inject([ParticipantService], (service: ParticipantService) => {
    const email = undefined;
    const participants: ParticipantModel[] = [];
    expect(() => service.checkDuplication(email, participants)).toThrowError(`Cannot check for duplication on undefined email`);
  }));
  it('should check email duplication and return true, duplicated participant emails found', inject([ParticipantService], (service: ParticipantService) => {
    const part1 = new ParticipantModel();
    part1.email = 'aa@aa.aa';
    const participants: ParticipantModel[] = [];
    participants.push(part1);
    var result = service.checkDuplication('aa@aa.aa', participants);
    expect(result).toBeTruthy();
  }));
  it('should remove participant', inject([ParticipantService], (service: ParticipantService) => {
    const hearing: HearingModel = new HearingModel();
    const part1 = new ParticipantModel();
    part1.email = 'aa@aa.aa';
    const participants: ParticipantModel[] = [];
    participants.push(part1);
    hearing.participants = participants;

    var result = service.removeParticipant(hearing,'aa@aa.aa');
    expect(hearing.participants.length).toBe(0);
  }));
  it('should not remove participant, if email is not in the list', inject([ParticipantService], (service: ParticipantService) => {
    const hearing: HearingModel = new HearingModel();
    const part1 = new ParticipantModel();
    part1.email = 'aa@aa.aa';
    const participants: ParticipantModel[] = [];
    participants.push(part1);
    hearing.participants = participants;

    var result = service.removeParticipant(hearing, 'bb@bb.bb');
    expect(hearing.participants.length).toBe(1);
  }));
});

