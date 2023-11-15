import { JudiciaryParticipantResponse } from 'src/app/services/clients/api-client';

export type JudicaryRoleCode = 'Judge' | 'PanelMember';

export class JudicialMemberDto {
    public roleCode?: JudicaryRoleCode;
    public displayName: string;
    constructor(
        public firstName: string,
        public lastName: string,
        public fullName: string,
        public email: string,
        public telephone: string,
        public personalCode: string
    ) {}

    static fromJudiciaryParticipantResponse(response: JudiciaryParticipantResponse): JudicialMemberDto {
        const dto = new JudicialMemberDto(
            response.first_name,
            response.last_name,
            response.full_name,
            response.email,
            response.work_phone,
            response.personal_code
        );
        dto.roleCode = response.role_code as JudicaryRoleCode;
        dto.displayName = response.display_name;
        return dto;
    }
}
