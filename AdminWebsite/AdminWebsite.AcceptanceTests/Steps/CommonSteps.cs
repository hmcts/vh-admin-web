using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System;
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
        private readonly BookingDetailsSteps _bookingsListSteps;
        private readonly BookingConfirmationStep _bookingConfirmationStep;
        public CommonSteps(Common common, DashboardSteps dashboardStep, 
            HearingDetailsSteps hearingDetailsSteps, LoginSteps loginStep,
            HearingScheduleSteps hearingScheduleSteps, AssignJudgeSteps assignJudgeStep, 
            AddParticipantsSteps addParticipantsSteps, OtherInformationSteps otherInformationStep,
            SummarySteps summarySteps, BookingDetailsSteps bookingsListSteps, BookingConfirmationStep bookingConfirmationStep)
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
            _bookingConfirmationStep = bookingConfirmationStep;
        }
        [Given(@"user proceeds to next page")]
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
        [Given(@"(.*) is on hearing schedule page")]
        public void AdminIsOnHearingSchedulePage(string admin)
        {
            _loginStep.UserLogsInWithValidCredentials(admin);
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
            _otherInformationStep.WhenUserAddsOtherInformationToBookingHearing();
        }
        [Given(@"(.*) is on other information page")]
        public void AdminOnOtherInformationPage(string admin)
        {
            AdminIsOnAddParticipantsPage(admin);
            _addParticipantsSteps.ProfessionalParticipantIsAddedToHearing();
            _common.NextButton();
            _otherInformationStep.WhenUserAddsOtherInformationToBookingHearing();
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
        [Given(@"(.*) is on assign judge page")]
        public void AdminIsOnAssignJudgePage(string admin)
        {
            AdminIsOnHearingSchedulePage(admin);
            _hearingScheduleSteps.WhenHearingScheduleFormIsFilled();
            _common.NextButton();
            _assignJudgeStep.AssignJudgePage();
        }
        [Given(@"(.*) is on add participants page")]
        public void AdminIsOnAddParticipantsPage(string admin)
        {
            AdminIsOnAssignJudgePage(admin);
            _assignJudgeStep.AssignJudgeToHearing();
            _common.NextButton();
            _addParticipantsSteps.AddParticipantsPage();
        }

        [When(@"user is on Summary page")]
        [Given(@"user is on Summary page")]
        public void GivenUserIsOnSummaryPage()
        {
            GivenUserIsOnOtherInformationPage();
            _common.NextButton();
        }
        [When(@"(.*) is on Summary page")]
        [Given(@"(.*) is on Summary page")]
        public void AdminIsOnSummaryPage(string admin)
        {
            AdminOnOtherInformationPage(admin);
            _common.NextButton();
        }
        [Given(@"(.*) tries to amend booking")]
        public void AdminTriesToAmendBooking(string admin)
        {
            AdminIsOnSummaryPage(admin);
            _summarySteps.WhenUserSubmitBooking();
            _bookingConfirmationStep.BookHearingConfirmation();
            _bookingsListSteps.UpdateParticipantDetails();
        }
        [Given(@"hearing is booked by (.*)")]
        public void HearingIsBookedByAdmin(string admin)
        {
            AdminIsOnSummaryPage(admin);
            _summarySteps.WhenUserSubmitBooking();
            _bookingConfirmationStep.BookHearingConfirmation();
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
        [When(@"user tries to navigate away from (.*) a hearing")]
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
                    break;
                case Breadcrumbs.BookingsList:
                    GivenUserIsOnHearingSchedulePage();
                    UserNavigatesToBookingsList();
                    break;
                case "HMCTS Video hearing service":
                    GivenUserIsOnHearingSchedulePage();
                    UserClicksTopMenuLogo();
                    break;
            }
            _common.AddItems<string>("BookingPage", bookingPage);
        }
        [When(@"user discards changes")]
        public void WhenUserDiscardsChanges()
        {
            try
            {
                _common.CancelButton();
                _common.CancelWarningMessage().Should().Be("Are you sure you want to discard them?");
                _common.DiscardChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"No user warning message is displayed: {ex.Message}");
            }           
        }
        public void UserClicksTopMenuLogo() => _common.TopMenuHmctsLogo();
        
        [Given(@"'(.*)' with multiple (.*) wants to add a (.*) to booking")]
        public void CaseAdminWithMultipleCaseTypes(string admin, string caseTypes, string party)
        {
            _loginStep.UserLogsInWithValidCredentials(admin);
            _dashboardStep.WhenBookAVideoHearingPanelIsSelected();
            _hearingDetailsSteps.GivenUserSelectsCaseTypeAsCivilMoneyClaims(caseTypes);
            _hearingScheduleSteps.WhenHearingScheduleIsUpdated();
            WhenNextButtonIsClicked();
            _assignJudgeStep.WhenHearingBookingIsAssignedToADifferentJudge();
            WhenNextButtonIsClicked();
            _addParticipantsSteps.WhenUserSelects(party);
        }
        [Given(@"'(.*)' with (.*) adds participant with (.*) and (.*) to booking")]
        public void AddsParticipantToBooking(string admin, string caseTypes, string party, string role)
        {
            CaseAdminWithMultipleCaseTypes(admin, caseTypes, party);
            _addParticipantsSteps.RoleIsSelected(role);
            WhenNextButtonIsClicked();
            _otherInformationStep.WhenUserAddsOtherInformationToBookingHearing();
            WhenNextButtonIsClicked();
            _summarySteps.SummaryPage();
        }
    }
}