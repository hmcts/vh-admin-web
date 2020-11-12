import { TestBed, inject } from '@angular/core/testing';
import { ParticipantService } from './participant.service';
import { HttpClientModule } from '@angular/common/http';
import { CaseAndHearingRolesResponse } from '../../services/clients/api-client';
import { ParticipantModel } from '../../common/model/participant.model';
import { HearingModel } from '../../common/model/hearing.model';
import { Logger } from '../../services/logger';

describe('ParticipantService', () => {
    let loggerSpy: jasmine.SpyObj<Logger>;
    loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'info']);

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [ParticipantService, { provide: Logger, useValue: loggerSpy }]
        });
    });

    it('should be created', inject([ParticipantService], (service: ParticipantService) => {
        expect(service).toBeTruthy();
    }));
    it('should map roles to party model array', inject([ParticipantService], (service: ParticipantService) => {
        const response = new CaseAndHearingRolesResponse();
        response.name = 'Defendant';
        response.hearing_roles = ['Litigant in person'];
        const responses: CaseAndHearingRolesResponse[] = [];
        responses.push(response);

        const models = service.mapParticipantsRoles(responses);
        expect(models).toBeTruthy();
        expect(models.length).toBe(1);
        expect(models[0].name).toBe('Defendant');
        expect(models[0].hearingRoles.length).toBe(1);
        expect(models[0].hearingRoles[0]).toBe('Litigant in person');
    }));
    it('should return empty party model array', inject([ParticipantService], (service: ParticipantService) => {
        const responses: CaseAndHearingRolesResponse[] = [];
        const models = service.mapParticipantsRoles(responses);
        expect(models).toBeTruthy();
        expect(models.length).toBe(0);
    }));
    it('should check email duplication and return false', inject([ParticipantService], (service: ParticipantService) => {
        const part1 = new ParticipantModel();
        part1.email = 'aa@aa.aa';
        const participants: ParticipantModel[] = [];
        participants.push(part1);
        const result = service.checkDuplication('bb@bb.bb', participants);
        expect(result).toBeFalsy();
    }));
    it('should check duplication returns false as no participants', inject([ParticipantService], (service: ParticipantService) => {
        const participants: ParticipantModel[] = [];
        const result = service.checkDuplication('bb@bb.bb', participants);
        expect(result).toBeFalsy();
    }));
    it('should throw exception if email is invalid', inject([ParticipantService], (service: ParticipantService) => {
        const email = undefined;
        const participants: ParticipantModel[] = [];
        expect(() => service.checkDuplication(email, participants)).toThrowError(`Cannot check for duplication on undefined email`);
    }));
    it('should check email duplication and return true', inject([ParticipantService], (service: ParticipantService) => {
        const part1 = new ParticipantModel();
        part1.email = 'aa@aa.aa';
        const participants: ParticipantModel[] = [];
        participants.push(part1);
        const result = service.checkDuplication('aa@aa.aa', participants);
        expect(result).toBeTruthy();
    }));
    it('should remove participant', inject([ParticipantService], (service: ParticipantService) => {
        const hearing: HearingModel = new HearingModel();
        const part1 = new ParticipantModel();
        part1.email = 'aa@aa.aa';
        const participants: ParticipantModel[] = [];
        participants.push(part1);
        hearing.participants = participants;
        const result = service.removeParticipant(hearing, 'aa@aa.aa');
        expect(hearing.participants.length).toBe(0);
    }));
    it('should not remove participant, if email is not in the list', inject([ParticipantService], (service: ParticipantService) => {
        const hearing: HearingModel = new HearingModel();
        const part1 = new ParticipantModel();
        part1.email = 'aa@aa.aa';
        const participants: ParticipantModel[] = [];
        participants.push(part1);
        hearing.participants = participants;
        const result = service.removeParticipant(hearing, 'bb@bb.bb');
        expect(hearing.participants.length).toBe(1);
    }));
    it('should remove participant and log a message', inject([ParticipantService], (service: ParticipantService) => {
        const hearing: HearingModel = new HearingModel();
        hearing.hearing_id = '12345';
        const part1 = new ParticipantModel();
        part1.email = 'aa@aa.aa';
        part1.id = '123';
        const participants: ParticipantModel[] = [];
        participants.push(part1);
        hearing.participants = participants;
        const result = service.removeParticipant(hearing, 'aa@aa.aa');
        expect(loggerSpy.info).toHaveBeenCalled();
    }));
});
