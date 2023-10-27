export type JudicaryRoleCode = 'Judge' | 'PanelMember';

export class JudicialMemberDto {
    public roleCode: JudicaryRoleCode;
    constructor(public firstName: string, public lastName: string, public email: string, public personalCode: string) {}
}
