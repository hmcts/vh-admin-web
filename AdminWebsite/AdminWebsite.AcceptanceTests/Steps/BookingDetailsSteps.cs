using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using NUnit.Framework;
using OpenQA.Selenium;
using System;
using System.Linq;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class BookingDetailsSteps
    {
        private readonly BookingDetails _bookingDetails;
        private readonly ScenarioContext _scenarioContext;
        public BookingDetailsSteps(BookingDetails bookingDetails, ScenarioContext scenarioContext)
        {
            _bookingDetails = bookingDetails;
            _scenarioContext = scenarioContext;
        }
        [When(@"user is on bookings list page")]
        public void BookingsListPage()
        {
            _bookingDetails.PageUrl(PageUri.BookingListPage);
        }
        [Then(@"admin user can view booking list")]
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
        [Then(@"amended values should be saved")]
        public void AmendedValuesShouldBeSaved()
        {
            _bookingDetails.BookButton();
            _bookingDetails.PageUrl(PageUri.BookingDetailsPage);
            
            switch (_bookingDetails.GetItems("RelevantPage"))
            {
                case PageUri.AssignJudgePage:
                    _bookingDetails.JudgeEmail().Should().Contain(_bookingDetails.GetItems("Judge"));
                    break;
                case PageUri.HearingDetailsPage:
                    _bookingDetails.CaseName().Should().Be(TestData.HearingDetails.CaseName1);
                    _bookingDetails.CaseNumber().Should().Be(TestData.HearingDetails.CaseNumber1);
                    break;
                case PageUri.HearingSchedulePage:
                    _bookingDetails.HearingDate().ToLower().Should().Be(_bookingDetails.GetItems("HearingDate"));
                    _bookingDetails.CourtAddress().Should().Be($"{TestData.HearingSchedule.CourtAddress.ToList().Last()} {TestData.HearingSchedule.Room}");
                    _bookingDetails.HearingDuration().Should().Be("30 minutes");
                    break;                
                case PageUri.OtherInformationPage:
                    _bookingDetails.OtherInformation().Should().Be(TestData.OtherInformation.OtherInformationText);
                    break;
            }
            _bookingDetails.EditedBy().Should().Be(_scenarioContext.Get<string>("Username"));
        }
        [When(@"the admin cancels hearing")]
        public void WhenTheAdminCancelsHearing()
        {
            _bookingDetails.CancelBookingButton();
            _bookingDetails.PopupCancelBookingWarningMessage().Should().Be(TestData.BookingDetails.CancelBookingWarningMessage);
            _bookingDetails.PopupCancelBookingButton();
        }
        [Then(@"cancelled label should be shown on booking details page")]
        public void ThenCancelledLabelShouldBeShownOnHearing()
        {
            _bookingDetails.CancelledLabel().Should().Be(TestData.BookingDetails.CancelledLabel);
        }
        [Then(@"booking details page should be displayed without the Edit or Cancel buttons")]
        public void NoEditOrCancelButtons()
        {
            Assert.Throws<WebDriverTimeoutException>(() => _bookingDetails.EditBookingList());
            Assert.Throws<WebDriverTimeoutException>(() => _bookingDetails.CancelBookingButton());
        }
    }
}