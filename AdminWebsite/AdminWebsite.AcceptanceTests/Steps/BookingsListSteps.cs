using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System;
using System.Linq;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class BookingsListSteps
    {
        private readonly BookingsList _bookingsList;
        private readonly ScenarioContext _scenarioContext;
        public BookingsListSteps(BookingsList bookingsList, ScenarioContext scenarioContext)
        {
            _bookingsList = bookingsList;
            _scenarioContext = scenarioContext;
        }
        [When(@"user is on bookings list page")]
        public void BookingsListPage()
        {
            _bookingsList.PageUrl(PageUri.BookingListPage);
        }
        [Then(@"admin user can view booking list")]
        public void ThenAdminUserCanViewBookingList()
        {
            _bookingsList.BookingsList();
            BookingsListPage();
            _bookingsList.SelectHearing(_bookingsList.GetItems("CaseNumber"));
        }
        [When(@"admin user tries to amend booking")]
        public void UpdateParticipantDetails()
        {            
            _bookingsList.BookingsList();
            BookingsListPage();
            _bookingsList.SelectHearing(_bookingsList.GetItems("CaseNumber"));
            _bookingsList.EditBookingList();
            _bookingsList.BookingDetailsTitle().Should().Be(_bookingsList.GetItems("CaseNumber"));
        }
        [Then(@"expected details should be populated")]
        public void ThenExpectedDetailsShouldBePopulated()
        {
            var username = _scenarioContext.Get<string>("Username");
            if (username.Contains("vhofficer"))
            {
                _bookingsList.ParticipantUsername().Should().Contain("reform");
            }
            if (username.Contains("caseadmin"))
            {
                var exception = string.Empty;
                 try
                {
                    _bookingsList.ParticipantUsername().Should().Contain("reform");
                }
                catch (Exception ex)
                {
                    exception = ex.InnerException.Message;
                }
                exception.ToLower().Should().Contain("unable to locate element:");
            }
            _bookingsList.CreatedBy().Should().Be(username);
        }
        [Then(@"amended values should be saved")]
        public void AmendedValuesShouldBeSaved()
        {
            _bookingsList.BookButton();
            _bookingsList.PageUrl(PageUri.BookingDetailsPage);
            
            switch (_bookingsList.GetItems("RelevantPage"))
            {
                case PageUri.AssignJudgePage:
                    _bookingsList.JudgeEmail().Should().Contain(_bookingsList.GetItems("Judge"));
                    break;
                case PageUri.HearingDetailsPage:
                    _bookingsList.CaseName().Should().Be(TestData.HearingDetails.CaseName1);
                    _bookingsList.CaseNumber().Should().Be(TestData.HearingDetails.CaseNumber1);
                    break;
                case PageUri.HearingSchedulePage:
                    _bookingsList.HearingDate().ToLower().Should().Be(_bookingsList.GetItems("HearingDate"));
                    _bookingsList.CourtAddress().Should().Be($"{TestData.HearingSchedule.CourtAddress.ToList().Last()} {TestData.HearingSchedule.Room}");
                    _bookingsList.HearingDuration().Should().Be("30 minutes");
                    break;                
                case PageUri.OtherInformationPage:
                    _bookingsList.OtherInformation().Should().Be(TestData.OtherInformation.OtherInformationText);
                    break;
            }
        }
    }
}