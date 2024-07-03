import { AvailableLanguageResponse, InterprepretationType, JudiciaryParticipantResponse } from 'src/app/services/clients/api-client';
import { InterpreterSelectedDto } from '../../interpreter-form/interpreter-selected.model';

export type JudicaryRoleCode = 'Judge' | 'PanelMember';

export class JudicialMemberDto {
    public roleCode?: JudicaryRoleCode;
    public displayName: string;
    public optionalContactNumber: string;
    public optionalContactEmail: string;
    public interpretationLanguage: InterpreterSelectedDto;
    constructor(
        public firstName: string,
        public lastName: string,
        public fullName: string,
        public email: string,
        public telephone: string,
        public personalCode: string,
        public isGeneric: boolean
    ) {}

    static fromJudiciaryParticipantResponse(response: JudiciaryParticipantResponse): JudicialMemberDto {
        const dto = new JudicialMemberDto(
            response.first_name,
            response.last_name,
            response.full_name,
            response.email,
            response.work_phone,
            response.personal_code,
            response.is_generic
        );
        dto.optionalContactNumber = response.optional_contact_telephone;
        dto.optionalContactEmail = response.optional_contact_email;
        dto.roleCode = response.role_code as JudicaryRoleCode;
        dto.displayName = response.display_name;
        dto.interpretationLanguage = this.mapInterpreterLanguage(response.interpreter_language);

        return dto;
    }

    static mapInterpreterLanguage(interpreterLanguage: AvailableLanguageResponse) {
        if (!interpreterLanguage) return null;

        let interpretationLanguage: InterpreterSelectedDto = {
            interpreterRequired: true,
            spokenLanguageCode: null,
            spokenLanguageCodeDescription: null,
            signLanguageCode: null,
            signLanguageDescription: null
        };
        switch (interpreterLanguage.type) {
            case InterprepretationType.Verbal:
                interpretationLanguage.spokenLanguageCode = interpreterLanguage.code;
                interpretationLanguage.spokenLanguageCodeDescription = interpreterLanguage.description;
                break;
            case InterprepretationType.Sign:
                interpretationLanguage.signLanguageCode = interpreterLanguage.code;
                interpretationLanguage.signLanguageDescription = interpreterLanguage.description;
                break;
            default:
                throw new Error(`Unknown interpretation type ${interpreterLanguage.type}`);
        }

        return interpretationLanguage;
    }
}
