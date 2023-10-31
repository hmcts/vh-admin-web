export type JudicaryRoleCode = 'Judge' | 'PanelMember';

export class JudicialMemberDto {
    public roleCode: JudicaryRoleCode;
    public displayName: string;
    constructor(
        public firstName: string,
        public lastName: string,
        public fullName: string,
        public email: string,
        public telephone: string,
        public personalCode: string
    ) {}
}
