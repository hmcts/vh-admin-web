using AdminWebsite.AcceptanceTests.Helpers;
using FluentAssertions;
using NUnit.Framework;
using OpenQA.Selenium;
using System.Linq;
using AdminWebsite.AcceptanceTests.Data;
using TechTalk.SpecFlow;
using BookingDetails = AdminWebsite.AcceptanceTests.Pages.BookingDetails;
using TestContext = AdminWebsite.AcceptanceTests.Contexts.TestContext;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class BookingDetailsSteps
    {
        private readonly TestContext _context;
        private readonly BookingDetails _bookingDetails;
        private readonly ScenarioContext _scenarioContext;

        public BookingDetailsSteps(TestContext context, BookingDetails bookingDetails, ScenarioContext scenarioContext)
        {
            _context = context;
            _bookingDetails = bookingDetails;
            _scenarioContext = scenarioContext;
        }

        [When(@"user is on the bookings list page")]
        public void BookingsListPage()
        {
            _bookingDetails.PageUrl(PageUri.BookingListPage);
        }

        [Then(@"admin user can view the booking list")]
        public void ThenAdminUserCanViewBookingList()
        {
            _bookingDetails.BookingsList();
            BookingsListPage();
            _bookingDetails.SelectHearing(_bookingDetails.GetItems("CaseNumber"));
        }

        [When(@"admin user tries to amend booking")]
        public void UpdateParticipantDetails()
        {            
            _bookingDetails.BookingsList();
            BookingsListPage();
            _bookingDetails.SelectHearing(_bookingDetails.GetItems("CaseNumber"));
            _bookingDetails.EditBookingList();
            _bookingDetails.BookingDetailsTitle().Should().Be(_bookingDetails.GetItems("CaseNumber"));
        }

        [Then(@"expected details should be populated")]
        public void ThenExpectedDetailsShouldBePopulated()
        {
            var username = _scenarioContext.Get<string>("Username");
            if (username.Contains("vhofficer"))
            {
                _bookingDetails.ParticipantUsername().Should().Contain("reform");
            }
            if (username.Contains("caseadmin"))
            {
                Assert.Throws<WebDriverTimeoutException>(() => _bookingDetails.ParticipantUsername());
            }
            
            _bookingDetails.CreatedBy().Should().Be(username);
        }

        [Then(@"values should be displayed as expected on edit view")]
        [Then(@"amended values should be saved")]
        public void AmendedValuesShouldBeSaved()
        {
            _bookingDetails.ClickBookButton();
            _bookingDetails.PageUrl(PageUri.BookingDetailsPage);
            
            switch (_bookingDetails.GetItems("RelevantPage"))
            {
                case PageUri.AssignJudgePage:
                    _bookingDetails.JudgeEmail().Should().Contain(_bookingDetails.GetItems("Clerk"));
                    break;
                case PageUri.HearingDetailsPage:
                    _bookingDetails.CaseName().Should().Be(_context.TestData.HearingData.CaseName);
                    _bookingDetails.CaseNumber().Should().Be(_context.TestData.HearingData.CaseNumber);
                    break;
                case PageUri.HearingSchedulePage:
                    _bookingDetails.HearingDate().ToLower().Should().Be(_bookingDetails.GetItems("HearingDate"));
                    _bookingDetails.CourtAddress().Should().Be($"{HearingScheduleData.CourtAddress.Last()}, {_context.TestData.HearingScheduleData.Room}");
                    _bookingDetails.HearingDuration().Should().Be(_context.TestData.HearingScheduleData.GetHearingDurationAsText());
                    break;                
                case PageUri.OtherInformationPage:
                    _bookingDetails.OtherInformation().Should().Be(OtherInformation.OtherInformationText);
                    break;
            }
            _bookingDetails.EditedBy().Should().Be(_scenarioContext.Get<string>("Username"));
        }

        [When(@"the admin cancels hearing")]
        public void WhenTheAdminCancelsHearing()
        {
            _bookingDetails.CancelBookingButton();
            _bookingDetails.PopupCancelBookingWarningMessage().Should().Be(Data.BookingDetails.CancelBookingWarningMessage);
            _bookingDetails.PopupCancelBookingButton();
        }

        [Then(@"cancelled label should be shown on booking details page")]
        public void ThenCancelledLabelShouldBeShownOnHearing()
        {
            _bookingDetails.CancelledLabel().Should().Be(Data.BookingDetails.CancelledLabel);
        }

        [Then(@"booking details page should be displayed without the Edit or Cancel buttons")]
        public void NoEditOrCancelButtons()
        {
            Assert.Throws<WebDriverTimeoutException>(() => _bookingDetails.EditBookingList());
            Assert.Throws<WebDriverTimeoutException>(() => _bookingDetails.CancelBookingButton());
        }
    }
}