import { JudgeAccountType, JudgeResponse, PersonResponse } from 'src/app/services/clients/api-client';
import { LinkedParticipantModel } from './linked-participant.model';

export class ParticipantModel {
    id?: string | undefined;
    title?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    middle_names?: string | undefined;
    display_name?: string | undefined;
    username?: string | undefined;
    email?: string | undefined;
    case_role_name?: string | undefined;
    hearing_role_name?: string | undefined;
    phone?: string | undefined;
    representee?: string | undefined;
    company?: string | undefined;
    is_judge: boolean;
    is_exist_person: boolean;
    interpreterFor?: string;
    linked_participants?: LinkedParticipantModel[];
    interpretee_name?: string | undefined;
    is_interpretee?: boolean | undefined;
    user_role_name?: string | undefined;
    is_courtroom_account?: boolean;

    static fromPersonResponse(person: PersonResponse): ParticipantModel {
        let participant: ParticipantModel;
        if (person) {
            participant = new ParticipantModel();
            participant.id = person.id;
            participant.title = person.title;
            participant.first_name = person.first_name;
            participant.middle_names = person.middle_names;
            participant.last_name = person.last_name;
            participant.username = person.username;
            participant.email = person.contact_email ?? person.username;
            participant.phone = person.telephone_number;
            participant.representee = '';
            participant.company = person.organisation;
        }

        return participant;
    }

    static fromJudgeResponse(judge: JudgeResponse): ParticipantModel {
        let participant: ParticipantModel;
        if (judge) {
            participant = new ParticipantModel();
            participant.first_name = judge.first_name;
            participant.last_name = judge.last_name;
            participant.username = judge.email;
            participant.email = judge.email;
            participant.display_name = judge.display_name;
            participant.is_courtroom_account = judge.account_type === JudgeAccountType.Courtroom;
        }
        return participant;
    }
}
