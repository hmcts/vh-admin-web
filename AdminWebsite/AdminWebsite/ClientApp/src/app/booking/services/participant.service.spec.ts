import { TestBed, inject } from '@angular/core/testing';
import { ParticipantService } from './participant.service';
import { HttpClientModule } from '@angular/common/http';
import { HearingRoleResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { HearingRoleModel } from 'src/app/common/model/hearing-role.model';
import { createVHBooking, VHBooking } from 'src/app/common/model/vh-booking';
import { VHParticipant } from 'src/app/common/model/vh-participant';

describe('ParticipantService', () => {
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'info']);

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [ParticipantService, { provide: Logger, useValue: loggerSpy }]
        });
    });

    it('should be created', inject([ParticipantService], (service: ParticipantService) => {
        expect(service).toBeTruthy();
    }));
    it('should map roles to hearing role array', inject([ParticipantService], (service: ParticipantService) => {
        const responses: HearingRoleResponse[] = [
            new HearingRoleResponse({
                name: 'Applicant',
                code: 'APPL',
                user_role: 'Individual'
            }),
            new HearingRoleResponse({
                name: 'Interpreter',
                code: 'INTP',
                user_role: 'Individual'
            })
        ];

        const models = service.mapParticipantHearingRoles(responses);
        expect(models).toBeTruthy();
        expect(models).toEqual([
            new HearingRoleModel('Applicant', 'Individual', 'APPL'),
            new HearingRoleModel('Interpreter', 'Individual', 'INTP')
        ]);
    }));
    it('should check email duplication and return false', inject([ParticipantService], (service: ParticipantService) => {
        const part1 = new VHParticipant();
        part1.email = 'aa@hmcts.net';
        const participants: VHParticipant[] = [];
        participants.push(part1);
        const result = service.checkDuplication('bb@hmcts.net', participants);
        expect(result).toBeFalsy();
    }));
    it('should check duplication returns false as no participants', inject([ParticipantService], (service: ParticipantService) => {
        const participants: VHParticipant[] = [];
        const result = service.checkDuplication('bb@hmcts.net', participants);
        expect(result).toBeFalsy();
    }));
    it('should throw exception if email is invalid', inject([ParticipantService], (service: ParticipantService) => {
        const email = undefined;
        const participants: VHParticipant[] = [];
        expect(() => service.checkDuplication(email, participants)).toThrowError(`Cannot check for duplication on undefined email`);
    }));
    it('should check email duplication and return true', inject([ParticipantService], (service: ParticipantService) => {
        const part1 = new VHParticipant();
        part1.email = 'aa@hmcts.net';
        const participants: VHParticipant[] = [];
        participants.push(part1);
        const result = service.checkDuplication('aa@hmcts.net', participants);
        expect(result).toBeTruthy();
    }));
    it('should remove participant', inject([ParticipantService], (service: ParticipantService) => {
        const hearing: VHBooking = createVHBooking();
        const part1 = new VHParticipant();
        part1.email = 'aa@hmcts.net';
        const participants: VHParticipant[] = [];
        participants.push(part1);
        hearing.participants = participants;
        const result = service.removeParticipant(hearing, 'aa@hmcts.net');
        expect(hearing.participants.length).toBe(0);
    }));
    it('should not remove participant, if email is not in the list', inject([ParticipantService], (service: ParticipantService) => {
        const hearing: VHBooking = createVHBooking();
        const part1 = new VHParticipant();
        part1.email = 'aa@hmcts.net';
        const participants: VHParticipant[] = [];
        participants.push(part1);
        hearing.participants = participants;
        const result = service.removeParticipant(hearing, 'bb@hmcts.net');
        expect(hearing.participants.length).toBe(1);
    }));
    it('should remove participant and log a message', inject([ParticipantService], (service: ParticipantService) => {
        const hearing: VHBooking = createVHBooking();
        hearing.hearing_id = '12345';
        const part1 = new VHParticipant();
        part1.email = 'aa@hmcts.net';
        part1.id = '123';
        const participants: VHParticipant[] = [];
        participants.push(part1);
        hearing.participants = participants;
        const result = service.removeParticipant(hearing, 'aa@hmcts.net');
        expect(loggerSpy.info).toHaveBeenCalled();
    }));
});
