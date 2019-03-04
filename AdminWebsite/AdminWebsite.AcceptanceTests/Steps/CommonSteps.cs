using AdminWebsite.AcceptanceTests.Pages;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class CommonSteps
    {
        private readonly Common _common;
        private readonly HearingDetails _hearingDetails;
        private readonly DashboardSteps _dashboardStep;
        private readonly HearingDetailsSteps _hearingDetailsSteps;
        private readonly LoginSteps _loginStep;
        private readonly HearingScheduleSteps _hearingScheduleSteps;
        private readonly AssignJudgeSteps _assignJudgeStep;
        private readonly AddParticipantsSteps _addParticipantsSteps;
        public CommonSteps(Common common, HearingDetails hearingDetails,
            DashboardSteps dashboardStep, HearingDetailsSteps hearingDetailsSteps, LoginSteps loginStep,
            HearingScheduleSteps hearingScheduleSteps, AssignJudgeSteps assignJudgeStep, AddParticipantsSteps addParticipantsSteps)
        {
            _common = common;
            _hearingDetails = hearingDetails;
            _dashboardStep = dashboardStep;
            _hearingDetailsSteps = hearingDetailsSteps;
            _loginStep = loginStep;
            _hearingScheduleSteps = hearingScheduleSteps;
            _assignJudgeStep = assignJudgeStep;
            _addParticipantsSteps = addParticipantsSteps;
        }
        [When(@"user proceeds to next page")]
        [When(@"next button is clicked")]
        public void WhenNextButtonIsClicked()
        {           
            _common.NextButton();
        }
        [Given(@"user is on hearing schedule page")]
        public void GivenUserIsOnHearingSchedulePage()
        {
            _dashboardStep.WhenBookAVideoHearingPanelIsSelected();
            _hearingDetailsSteps.WhenHearingDetailsFormIsFilled();
            _common.NextButton();
        }
        [Given(@"user is on other information page")]
        public void GivenUserIsOnOtherInformationPage()
        {
            GivenUserIsOnHearingSchedulePage();
            _hearingScheduleSteps.WhenHearingScheduleFormIsFilled();
            _common.NextButton();
            _assignJudgeStep.AssignJudgeToHearing();
            _common.NextButton();
            _addParticipantsSteps.ProfessionalParticipantIsAddedToHearing();
            _common.NextButton();
        }
    }
}