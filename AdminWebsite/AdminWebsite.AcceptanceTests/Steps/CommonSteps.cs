using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System;
using System.Linq;
using System.Net;
using System.Runtime.Serialization;
using AdminWebsite.AcceptanceTests.Builders;
using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.BookingsAPI.Client;
using TechTalk.SpecFlow;
using Testing.Common;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class CommonSteps
    {
        private readonly TestContext _context;
        private readonly Common _common;
        private readonly DashboardSteps _dashboardStep;
        private readonly HearingDetailsSteps _hearingDetailsSteps;
        private readonly LoginSteps _loginStep;
        private readonly HearingScheduleSteps _hearingScheduleSteps;
        private readonly AssignClerkSteps _assignClerkStep;
        private readonly AddParticipantsSteps _addParticipantsSteps;
        private readonly OtherInformationSteps _otherInformationStep;
        private readonly SummarySteps _summarySteps;
        private readonly BookingDetailsSteps _bookingDetailsSteps;
        private readonly BookingConfirmationStep _bookingConfirmationStep;

        public CommonSteps(TestContext context, Common common, DashboardSteps dashboardStep, 
            HearingDetailsSteps hearingDetailsSteps, LoginSteps loginStep,
            HearingScheduleSteps hearingScheduleSteps, AssignClerkSteps assignClerkStep, 
            AddParticipantsSteps addParticipantsSteps, OtherInformationSteps otherInformationStep,
            SummarySteps summarySteps, BookingDetailsSteps bookingsListSteps, BookingConfirmationStep bookingConfirmationStep)
        {
            _context = context;
            _common = common;
            _dashboardStep = dashboardStep;
            _hearingDetailsSteps = hearingDetailsSteps;
            _loginStep = loginStep;
            _hearingScheduleSteps = hearingScheduleSteps;
            _assignClerkStep = assignClerkStep;
            _addParticipantsSteps = addParticipantsSteps;
            _otherInformationStep = otherInformationStep;
            _summarySteps = summarySteps;
            _bookingDetailsSteps = bookingsListSteps;
            _bookingConfirmationStep = bookingConfirmationStep;
        }

        [Given(@"user proceeds to the next page")]
        [When(@"user proceeds to the summary page")]
        [When(@"user proceeds to the next page")]
        [When(@"next button is clicked")]
        public void WhenNextButtonIsClicked()
        {           
            _common.ClickNextButton();
        }

        [Given(@"an individual is already a participant of another hearing")]
        public void GivenIHaveAHearing()
        {
            var endpoint = new BookingsApiUriFactory().HearingsEndpoints;
            var request = new HearingRequestBuilder().WithContext(_context);

            _context.Request = _context.Post(endpoint.BookNewHearing(), request.Build());

            new ExecuteRequestBuilder()
                .WithContext(_context)
                .WithExpectedStatusCode(HttpStatusCode.Created)
                .SendToBookingsApi();

            _context.Hearing = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(_context.Json);
            _context.Hearing.Should().NotBeNull();
            if (_context.Hearing.Id == null)
                throw new InvalidDataContractException("Hearing Id must be set");
            _context.HearingId = (Guid)_context.Hearing.Id;      
        }

        [Given(@"user is on the hearing schedule page")]
        public void GivenUserIsOnHearingSchedulePage()
        {
            _dashboardStep.WhenBookAVideoHearingPanelIsSelected();
            _hearingDetailsSteps.WhenHearingDetailsFormIsFilled();
            _common.ClickNextButton();
            _hearingScheduleSteps.HearingSchedulePage();
        }

        [Given(@"(.*) is on the hearing schedule page")]
        public void AdminIsOnHearingSchedulePage(string admin)
        {
            _loginStep.UserLogsInWithValidCredentials(admin);
            _dashboardStep.WhenBookAVideoHearingPanelIsSelected();
            _hearingDetailsSteps.WhenHearingDetailsFormIsFilled();
            _common.ClickNextButton();
            _hearingScheduleSteps.HearingSchedulePage();
        }

        [Given(@"user is on the hearing details page")]
        public void UserIsOnHearingDetailsPage()
        {
            _dashboardStep.WhenBookAVideoHearingPanelIsSelected();
            _hearingDetailsSteps.HearingDetailsPage();
        }
        
        [Given(@"user is on the other information page")]
        public void GivenUserIsOnOtherInformationPage()
        {
            GivenUserIsOnAddParticipantsPage();
            _addParticipantsSteps.UserAddsPartiesWithNewUsers();
            _otherInformationStep.WhenUserAddsOtherInformationToBookingHearing();
        }

        [Given(@"(.*) is on the other information page")]
        public void AdminOnOtherInformationPage(string admin)
        {
            AdminIsOnAddParticipantsPage(admin);
            _addParticipantsSteps.UserAddsPartiesWithNewUsers();
            _otherInformationStep.WhenUserAddsOtherInformationToBookingHearing();
        }

        [When(@"user is in processing of booking hearing")]
        public void WhenUserIsInProcessingOfBookingHearing()
        {
            _hearingDetailsSteps.InputCaseNumber();
            _hearingDetailsSteps.InputCaseName();
        }
        
        [Given(@"user is on the assign judge page")]
        public void GivenUserIsOnAssignJudgePage()
        {
            GivenUserIsOnHearingSchedulePage();
            _hearingScheduleSteps.WhenHearingScheduleFormIsFilled();
            _common.ClickNextButton();
            _assignClerkStep.AssignClerkPage();
        }
        
        [Given(@"user is on the add participants page")]
        public void GivenUserIsOnAddParticipantsPage()
        {
            GivenUserIsOnAssignJudgePage();
            _assignClerkStep.AssignClerkToHearing();
            _common.ClickNextButton();
            _addParticipantsSteps.UserIsOnTheAddParticipantsPage();
        }

        [Given(@"(.*) is on the assign judge page")]
        public void AdminIsOnAssignJudgePage(string admin)
        {
            AdminIsOnHearingSchedulePage(admin);
            _hearingScheduleSteps.WhenHearingScheduleFormIsFilled();
            _common.ClickNextButton();
            _assignClerkStep.AssignClerkPage();
        }

        [Given(@"(.*) is on the add participants page")]
        public void AdminIsOnAddParticipantsPage(string admin)
        {
            AdminIsOnAssignJudgePage(admin);
            _assignClerkStep.AssignClerkToHearing();
            _common.ClickNextButton();
            _addParticipantsSteps.UserIsOnTheAddParticipantsPage();
        }

        [Given(@"user is on the Summary page")]
        [When(@"user is on the Summary page")]
        public void GivenUserIsOnSummaryPage()
        {
            GivenUserIsOnOtherInformationPage();
            _common.ClickNextButton();
        }

        [Given(@"(.*) is on the Summary page")]
        [When(@"(.*) is on the Summary page")]
        public void AdminIsOnSummaryPage(string admin)
        {
            AdminOnOtherInformationPage(admin);
            _common.ClickNextButton();
        }

        [Given(@"(.*) amends booking")]
        public void AdminAmendsBooking(string admin)
        {
            AdminIsOnSummaryPage(admin);
            _summarySteps.WhenUserSubmitsTheBooking();
            _bookingConfirmationStep.BookHearingConfirmation();
            _bookingDetailsSteps.UpdateParticipantDetails();
        }

        [Given(@"hearing is booked by (.*)")]
        public void HearingIsBookedByAdmin(string admin)
        {
            AdminIsOnSummaryPage(admin);
            _summarySteps.WhenUserSubmitsTheBooking();
            _bookingConfirmationStep.BookHearingConfirmation();
        }

        [When(@"user navigates to the dashboard")]
        public void UserNavigatesToDashboard()
        {
            _common.DashBoard();
        }
        [When(@"user navigates to the bookings list")]
        public void UserNavigatesToBookingsList()
        {
            _common.BookingsList();
        }

        [Given(@"user is in the process of (.*) Hearing")]
        [When(@"user tries to navigate away from (.*) a hearing")]
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
            }
            _common.AddItems("BookingPage", bookingPage);
        }

        [When(@"user discards changes")]
        public void WhenUserDiscardsChanges()
        {
            try
            {
                _common.ClickCancelButton();
                _common.CancelWarningMessage().Should().Be("Are you sure you want to discard them?");
                _common.DiscardChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"No user warning message is displayed: {ex.Message}");
            }           
        }      

        [Given(@"(.*) is on the booking details page")]
        public void GivenCaseAdminIsOnBookingDetailsPage(string admin)
        {
            HearingIsBookedByAdmin(admin);
            _bookingConfirmationStep.BookAnotherHearing();
            _bookingDetailsSteps.ThenAdminUserCanViewBookingList();
        }

        [When(@"user adds other information and submits the booking")]
        public void WhenUserAddsOtherInformationAndSubmitsTheBooking()
        {
            _otherInformationStep.WhenUserAddsOtherInformationToBookingHearing();
            _common.ClickNextButton();
            _common.ClickBookButton();
            _bookingConfirmationStep.BookHearingConfirmation();
        }

        [Then(@"Participant details are displayed in the list")]
        public void ThenParticipantDetailAreDisplayedInTheList()
        {
            var actualResult = _common.GetAllParticipantsDetails();

            foreach (var participant in _context.TestData.ParticipantData)
            {
                var expectedParticipant = $"{participant.Title} {participant.Firstname} {participant.Lastname} {participant.Role.ToString().Replace("LIP", " LIP")}";

                if (participant.Role == RoleType.Solicitor)
                    expectedParticipant = $"{expectedParticipant}, representing {participant.ClientRepresenting}";

                actualResult.Any(x => x.Equals(expectedParticipant)).Should().BeTrue();
            }
        }
    }
}