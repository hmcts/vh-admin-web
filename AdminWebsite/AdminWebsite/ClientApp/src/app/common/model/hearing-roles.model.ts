export enum HearingRoles {
    APP = 'app',
    APP_ADVOCATE = 'app advocate',
    APPELLANT_LIP = 'appellant lip',
    APPLICANT_LIP = 'applicant lip',
    CLAIMANT_LIP = 'claimant lip',
    DEFENDANT_LIP = 'defendant lip',
    EXPERT = 'expert',
    INTERPRETER = 'interpreter',
    JUDGE = 'judge',
    LITIGANT_IN_PERSON = 'litigant in person',
    MACKENZIE_FRIEND = 'mackenzie friend',
    OBSERVER = 'observer',
    PANEL_MEMBER = 'panel member',
    PRESENTING_OFFICER = 'presenting officer',
    PROSECUTION = 'prosecution',
    PROSECUTION_ADVOCATE = 'prosecution advocate',
    REPRESENTATIVE = 'representative',
    RESPONDENT = 'respondent',
    RESPONDENT_ADVOCATE = 'respondent advocate',
    RESPONDENT_LIP = 'respondent lip',
    SPECIAL_COUNSEL = 'special counsel',
    STATE_LIP = 'state lip',
    WINGER = 'winger',
    WITNESS = 'witness'
}

export class HearingRoleCodes {
    public static readonly Applicant: string = 'APPL';
    public static readonly Intermediary: string = 'INTE';
    public static readonly Interpreter: string = 'INTP';
    public static readonly Representative: string = 'RPTT';
    public static readonly Respondent: string = 'RESP';
    public static readonly StaffMember: string = 'STAF';
    public static readonly WelfareRepresentative: string = 'WERP';
    public static readonly Observer: string = 'OBSV';
}
