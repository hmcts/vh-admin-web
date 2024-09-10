import { JudgeAccountType, JudgeResponse, PersonResponse } from 'src/app/services/clients/api-client';
import { LinkedParticipantModel } from './linked-participant.model';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';
import { InterpreterSelectedDto } from 'src/app/booking/interpreter-form/interpreter-selected.model';
import { SpecialMeasuresuremensDto as SpecialMeasuresuresDto } from 'src/app/booking/special-measures/special-measures.model';

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
    isJudiciaryMember?: boolean;
    interpretation_language: InterpreterSelectedDto;
    special_measures?: SpecialMeasuresuresDto;

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
                  company: person.organisation,
                  isJudiciaryMember: false,
                  interpretation_language: null
              }
            : null;
    }

    static fromJudgeResponse(judge: JudgeResponse): ParticipantModel {
        return judge
            ? {
                  ...judge,
                  email: judge.contact_email ?? judge.email,
                  username: judge.email,
                  is_courtroom_account: judge.account_type === JudgeAccountType.Courtroom,
                  isJudiciaryMember: false,
                  interpretation_language: null
              }
            : null;
    }

    static IsEmailEjud(email: string): boolean {
        return email?.toLowerCase().includes('judiciary') ?? false;
    }

    static fromJudicialMember(judicialMember: JudicialMemberDto, isJudge = false) {
        const hearingRoleName = isJudge ? 'Judge' : 'Panel Member';
        const userRoleName = isJudge ? 'Judge' : 'PanelMember';
        const hearingRoleCode = isJudge ? 'Judge' : 'PanelMember';
        return new ParticipantModel({
            first_name: judicialMember.firstName,
            last_name: judicialMember.lastName,
            hearing_role_name: hearingRoleName,
            username: judicialMember.email,
            email: judicialMember.email,
            is_exist_person: true,
            user_role_name: userRoleName,
            isJudiciaryMember: true,
            hearing_role_code: hearingRoleCode,
            phone: judicialMember.telephone,
            display_name: judicialMember.displayName,
            is_judge: isJudge,
            interpretation_language: judicialMember.interpretationLanguage
        });
    }
}
