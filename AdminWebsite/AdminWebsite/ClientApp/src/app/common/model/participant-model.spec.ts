import { TestBed } from '@angular/core/testing';
import { JudgeAccountType, JudgeResponse, PersonResponse } from 'src/app/services/clients/api-client';
import { ParticipantModel } from './participant.model';

describe('ParticipantModel', () => {
    let participant: ParticipantModel;

    beforeEach(() => {
        participant = new ParticipantModel();
    });

    it('should be created', () => {
        expect(participant).toBeTruthy();
    });

    it('should map PersonResponse to ParticipantModel', () => {
        const person = new PersonResponse({
            contact_email: 'aa@hmcts.net',
            first_name: 'Sam',
            last_name: 'Green',
            title: 'Ms',
            middle_names: 'No',
            telephone_number: '11111111',
            username: 'aa@hmcts.net',
            organisation: 'Name of a company'
        });

        participant = ParticipantModel.fromPersonResponse(person);

        expect(participant.email).toEqual(person.contact_email);
        expect(participant.first_name).toEqual(person.first_name);
        expect(participant.last_name).toEqual(person.last_name);
        expect(participant.middle_names).toEqual(person.middle_names);
        expect(participant.title).toEqual(person.title);
        expect(participant.phone).toEqual(person.telephone_number);
        expect(participant.username).toEqual(person.username);
        expect(participant.company).toEqual(person.organisation);
    });
    it('should mapping return empty ParticipantModel if  PersonResponse is null', () => {
        const person = null;
        participant = ParticipantModel.fromPersonResponse(person);
        expect(participant).toBeNull();
    });

    it('should map JudgeResponse to ParticipantModel', () => {
        const judge = new JudgeResponse({
            display_name: 'JudgeDisplayName',
            email: 'JudgeEmail',
            first_name: 'JudgeFirstName',
            last_name: 'JudgeLastName'
        });

        participant = ParticipantModel.fromJudgeResponse(judge);

        expect(participant.display_name).toEqual(judge.display_name);
        expect(participant.first_name).toEqual(judge.first_name);
        expect(participant.last_name).toEqual(judge.last_name);
        expect(participant.email).toEqual(judge.email);
        expect(participant.username).toEqual(judge.email);
    });

    it('should map isCourtroom as true if account_type is Courtroom', () => {
        const judge = new JudgeResponse({
            display_name: 'JudgeDisplayName',
            email: 'JudgeEmail',
            first_name: 'JudgeFirstName',
            last_name: 'JudgeLastName',
            account_type: JudgeAccountType.Courtroom
        });

        participant = ParticipantModel.fromJudgeResponse(judge);

        expect(participant.is_courtroom_account).toBeTruthy();
    });

    it('should map isCourtroom as false if account_type is not Courtroom', () => {
        const judge = new JudgeResponse({
            display_name: 'JudgeDisplayName',
            email: 'JudgeEmail',
            first_name: 'JudgeFirstName',
            last_name: 'JudgeLastName',
            account_type: JudgeAccountType.Judiciary
        });

        participant = ParticipantModel.fromJudgeResponse(judge);

        expect(participant.is_courtroom_account).toBeFalsy();
    });

    it('should mapping return empty ParticipantModel if  JudgeResponse is null', () => {
        const judge = null;
        participant = ParticipantModel.fromJudgeResponse(judge);
        expect(participant).toBeNull();
    });
});
