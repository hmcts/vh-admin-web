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
    is_judge?: boolean;
    is_exist_person?: boolean;
    interpreterFor?: string;
    linked_participants?: LinkedParticipantModel[];
    interpretee_name?: string | undefined;
    is_interpretee?: boolean | undefined;
    user_role_name?: string | undefined;
    is_courtroom_account?: boolean;
    addedDuringHearing?: boolean;
    account_type?: string | undefined;

    static fromPersonResponse(person: PersonResponse): ParticipantModel {
        return person
            ? {
                  ...person,
                  email: person.contact_email ?? person.username,
                  phone: person.telephone_number,
                  representee: '',
                  company: person.organisation,
                  account_type: ''
              }
            : null;
    }

    static fromJudgeResponse(judge: JudgeResponse): ParticipantModel {
        return judge
            ? {
                  ...judge,
                  username: judge.email,
                  is_courtroom_account: true,
                  account_type: JudgeAccountType.Courtroom
              }
            : null;
    }

    static fromJudiciaryResponse(person: PersonResponse): ParticipantModel {
        return person
            ? {
                ...person,
                email: person.contact_email ?? person.username,
                phone: person.telephone_number,
                representee: '',
                is_courtroom_account: false,
                company: person.organisation,
                account_type: JudgeAccountType.Judiciary
            }
            : null;
    }

    static IsEmailEjud(email: string): boolean {
        return email && email.toLowerCase().includes('judiciary');
    }
}
