import { JudgeAccountType, JudgeResponse, PersonResponse } from 'src/app/services/clients/api-client';
import { LinkedParticipantModel } from './linked-participant.model';

export class ParticipantModel {
    id?: string;
    title?: string;
    first_name?: string;
    last_name?: string;
    middle_names?: string;
    display_name?: string;
    username?: string;
    email?: string;
    case_role_name?: string;
    hearing_role_name?: string;
    hearing_role_code?: string;
    phone?: string;
    representee?: string;
    company?: string;
    is_judge?: boolean;
    is_exist_person?: boolean;
    interpreterFor?: string;
    linked_participants?: LinkedParticipantModel[];
    interpretee_name?: string;
    is_interpretee?: boolean;
    user_role_name?: string;
    is_courtroom_account?: boolean;
    addedDuringHearing?: boolean;
    is_staff_member?: boolean;
    contact_email?: string;

    constructor(init?: Partial<ParticipantModel>) {
        Object.assign(this, init);
    }

    static fromPersonResponse(person: PersonResponse): ParticipantModel {
        return person
            ? {
                  ...person,
                  email: person.contact_email ?? person.username,
                  phone: person.telephone_number,
                  representee: '',
                  company: person.organisation
              }
            : null;
    }

    static fromJudgeResponse(judge: JudgeResponse): ParticipantModel {
        return judge
            ? {
                  ...judge,
                  email: judge.contact_email ?? judge.email,
                  username: judge.email,
                  is_courtroom_account: judge.account_type === JudgeAccountType.Courtroom
              }
            : null;
    }

    static IsEmailEjud(email: string): boolean {
        return email?.toLowerCase().includes('judiciary') ?? false;
    }
}
