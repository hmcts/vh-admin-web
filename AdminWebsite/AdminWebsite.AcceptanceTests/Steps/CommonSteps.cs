using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class CommonSteps
    {
        private readonly Common _common;
        private readonly DashboardSteps _dashboardStep;
        private readonly HearingDetailsSteps _hearingDetailsSteps;
        private readonly LoginSteps _loginStep;
        private readonly HearingScheduleSteps _hearingScheduleSteps;
        private readonly AssignJudgeSteps _assignJudgeStep;
        private readonly AddParticipantsSteps _addParticipantsSteps;
        private readonly OtherInformationSteps _otherInformationStep;
        private readonly SummarySteps _summarySteps;
        private readonly BookingsListSteps _bookingsListSteps;
        public CommonSteps(Common common, DashboardSteps dashboardStep, 
            HearingDetailsSteps hearingDetailsSteps, LoginSteps loginStep,
            HearingScheduleSteps hearingScheduleSteps, AssignJudgeSteps assignJudgeStep, 
            AddParticipantsSteps addParticipantsSteps, OtherInformationSteps otherInformationStep,
            SummarySteps summarySteps, BookingsListSteps bookingsListSteps)
        {
            _common = common;
            _dashboardStep = dashboardStep;
            _hearingDetailsSteps = hearingDetailsSteps;
            _loginStep = loginStep;
            _hearingScheduleSteps = hearingScheduleSteps;
            _assignJudgeStep = assignJudgeStep;
            _addParticipantsSteps = addParticipantsSteps;
            _otherInformationStep = otherInformationStep;
            _summarySteps = summarySteps;
            _bookingsListSteps = bookingsListSteps;
        }
        [When(@"user proceeds to summary page")]
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
            _hearingScheduleSteps.HearingSchedulePage();
        }
        [Given(@"user is on hearing details page")]
        public void UserIsOnHearingDetailsPage()
        {
            _dashboardStep.WhenBookAVideoHearingPanelIsSelected();
            _hearingDetailsSteps.HearingDetailsPage();
        }
        [Given(@"user is on other information page")]
        public void GivenUserIsOnOtherInformationPage()
        {
            GivenUserIsOnAddParticipantsPage();
            _addParticipantsSteps.ProfessionalParticipantIsAddedToHearing();
            _common.NextButton();
            _otherInformationStep.MoreInformationPage();
        }
        [When(@"user is in processing of booking hearing")]
        public void WhenUserIsInProcessingOfBookingHearing()
        {
            _hearingDetailsSteps.InputCaseNumber();
            _hearingDetailsSteps.InputCaseName();
        }
        [Given(@"user is on assign judge page")]
        public void GivenUserIsOnAssignJudgePage()
        {
            GivenUserIsOnHearingSchedulePage();
            _hearingScheduleSteps.WhenHearingScheduleFormIsFilled();
            _common.NextButton();
            _assignJudgeStep.AssignJudgePage();
        }
        [Given(@"user is on add participants page")]
        public void GivenUserIsOnAddParticipantsPage()
        {
            GivenUserIsOnAssignJudgePage();
            _assignJudgeStep.AssignJudgeToHearing();
            _common.NextButton();
            _addParticipantsSteps.AddParticipantsPage();
        }
        [Given(@"user is on Summary page")]
        public void GivenUserIsOnSummaryPage()
        {
            GivenUserIsOnOtherInformationPage();
            _common.NextButton();
        }
        [When(@"user navigates to dashboard")]
        public void UserNavigatesToDashboard()
        {
            _common.DashBoard();
        }
        [When(@"user navigates to bookings list")]
        public void UserNavigatesToBookingsList()
        {
            _common.BookingsList();
        }
        [Given(@"user is in the process of (.*) Hearing")]
        public void GivenUserIsInTheProcessOfHearingDetailsHearing(string bookingPage)
        {           
            switch (bookingPage)
            {
                case Breadcrumbs.HearingDetails:
                    UserIsOnHearingDetailsPage();
                    _hearingDetailsSteps.InputCaseNumber();
                    _hearingDetailsSteps.InputCaseName();
                    break;
                case Breadcrumbs.HearingSchedule: GivenUserIsOnHearingSchedulePage();
                    break;
                case Breadcrumbs.AssignJudge: GivenUserIsOnAssignJudgePage();
                    break;
                case Breadcrumbs.AddParticipants: GivenUserIsOnAddParticipantsPage();
                    break;
                case Breadcrumbs.OtherInformation: GivenUserIsOnOtherInformationPage();
                    break;
                case Breadcrumbs.Summary: GivenUserIsOnSummaryPage();
                    break;
                case Breadcrumbs.Dashboard:
                    GivenUserIsOnHearingSchedulePage();
                    UserNavigatesToDashboard();
                    _dashboardStep.DashboardPage();
                    break;
                case Breadcrumbs.BookingsList:
                    GivenUserIsOnHearingSchedulePage();
                    UserNavigatesToBookingsList();
                    _bookingsListSteps.BookingsListPage();
                    break;
            }
        }
        [When(@"user cancels the update")]
        public void ClickCancelButton()
        {
            _common.CancelButton();
        }

    }
}