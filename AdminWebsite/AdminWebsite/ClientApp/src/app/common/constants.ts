export const Constants = {
    BookHearingTitle: 'Book a video hearing',
    PleaseSelect: 'Please select',
    Representative: 'Representative',
    PleaseSelectPattern: '^((?!Please select).)*$',
    TextInputPattern: /^[^%{}~|]+$/,
    TextInputPatternName: /^([-A-Za-z0-9 ',._])*$/,
    PostCodePattern: /^([a-zA-Z]{1,2}([0-9]{1,2}|[0-9][a-zA-Z])\s*[0-9][a-zA-Z]{2})$/,
    PhonePattern: /^([0-9() +-.])*$/,
    Judge: 'Judge',
    Citizen: 'Citizen',
    Professional: 'Professional',
    Error: {
        RoleErrorMsg: 'Please select a role',
        PartyErrorMsg: 'Please select a party',
        EmailErrorMsg: 'Please enter a valid email address',
        TitleErrorMsg: 'Please select a title',
        FirstNameErrorMsg: 'Please enter a first name',
        LastNameErrorMsg: 'Please enter a last name',
        PhoneErrorMsg: 'Please enter a valid telephone number',
        NoParticipantsErrorMsg: 'Please enter at least one participant',
        CompanyErrorMsg: 'Please enter an organisation name',
        ReferenceMsg: 'Please enter a reference',
        RepresenteeErrorMsg: 'Please enter a representee',
        JudgeDisplayNameErrorMsg: 'Please enter a judge name',
        DisplayNameErrorMsg: 'Please enter a display name',
        CompanyNameErrorMsg: 'Please enter a valid company name',
        OtherInformationErrorMsg: 'Please enter a valid other information text',
        InterpreterForErrorMsg: 'Please select a participant'
    },
    Contact: {
        phone: '0300 303 0655',
        email: 'video-hearings@justice.gov.uk'
    },
    IndividualRoles: ['Claimant LIP', 'Defendant LIP', 'Applicant LIP', 'Respondent LIP', 'Litigant in person'],
    DefenceAdvocate: 'App Advocate',
    None: 'None',
    RespondentAdvocate: 'Respondent Advocate'
};
