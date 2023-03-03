export const Constants = {
    AllocateHearings: {
        ConfirmationMessage: 'Hearings have been updated.'
    },
    BookHearingTitle: 'Book a video hearing',
    PleaseSelect: 'Please select',
    Representative: 'Representative',
    PleaseSelectPattern: '^((?!Please select).)*$',
    TextInputPattern: /^[^%{}~|]+$/,
    TextInputPatternDisplayName: /^([-A-Za-z0-9 ',._])*$/,
    TextInputPatternName: /^(\w+(?:\w|['._-](?!['._-]))*\w+)$/,
    PostCodePattern: /^([a-zA-Z]{1,2}([0-9]{1,2}|[0-9][a-zA-Z])\s*[0-9][a-zA-Z]{2})$/,
    EmailPattern: /^([!#-'*/-9=?A-Z^-~-]+(\.[!#-'*/-9=?A-Z^-~-]+)*)@([!#-'*/-9=?A-Z^-~-]+(\.[!#-'*/-9=?A-Z^-~-]+)+)+$/,
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
        JudgeUserAccountErrorMsg: 'Please enter a valid judge or courtroom account',
        JudgeDisplayNameErrorMsg: 'Please enter a judge name',
        DisplayNameErrorMsg: 'Please enter a display name',
        CompanyNameErrorMsg: 'Please enter a valid company name',
        OtherInformationErrorMsg: 'Please enter a valid other information text',
        InterpreterForErrorMsg: 'Please select a participant',
        JudgeParticipantErrorMsg:
            'The judge or courtroom account that you have entered cannot be the same as the panel member email address. Please enter an alternative account.',
        JohJudgeErrorMsg: 'The email address you have provided cannot be the same as the judge. Please enter an alternative.',
        JohEmailErrorMsg: 'Please enter an alternative email address',
        NotFoundJohEmail: 'The email address you have entered is not recognised. Please enter an alternative.',
        JudgeInvalidEmailErrorMsg: 'Please enter a valid judge or courtroom account',
        ManageJusticeUsers: {
            SearchFailure: 'There was an unexpected error. Please try again'
        },
        JusticeUserForm: {
            SaveError: 'There was an unexpected error. Please try again later.',
            SaveErrorDuplicateUser: 'A justice user with the same name already exists'
        }
    },
    Contact: {
        phone: '0300 303 0655',
        email: 'video-hearings@justice.gov.uk'
    },
    IndividualRoles: ['Claimant LIP', 'Defendant LIP', 'Applicant LIP', 'Respondent LIP', 'Litigant in person'],
    DefenceAdvocate: 'App Advocate',
    None: 'None',
    RespondentAdvocate: 'Respondent Advocate',
    JudiciaryRoles: ['Panel Member', 'Winger'],
    HearingRoles: {
        Judge: 'Judge',
        StaffMember: 'Staff Member',
        Winger: 'Winger',
        PanelMember: 'Panel Member',
        Observer: 'Observer',
        Interpreter: 'Interpreter'
    },
    ManageJusticeUsers: {
        EmptySearchResults:
            'No users matching this search criteria were found. Please check the search and try again. Or, add the team member.',
        NewUserAdded: 'Changes saved successfully. You can now add working hours and non-availability hours for this user.'
    },
    OtherParticipantRoles: ['Staff Member', 'Observer', 'Panel Member', 'Winger']
};
