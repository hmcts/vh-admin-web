using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System;
using System.Linq;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingScheduleSteps
    {
        private readonly HearingSchedule _hearingSchedule;

        public HearingScheduleSteps(HearingSchedule hearingSchedule)
        {
            _hearingSchedule = hearingSchedule;
        }

        [When(@"user enters video hearing schedule details")]
        [When(@"hearing schedule form is filled")]
        public void WhenHearingScheduleFormIsFilled()
        {
            HearingSchedulePage();
            //InputDateOfHearing();
            //InputHearingStartTime();
            //InputHearingDuration();
            //SelectHearingVenue();
            //EnterRoom();
            var date = DateTime.Now.AddDays(2);
            string[] splitDate = date.ToString("dd/MM/yyyy").Split('/');
            _hearingSchedule.AddItems<string>("HearingDate", date.ToString("dddd dd MMMM yyyy , HH:mm"));
            _hearingSchedule.HearingDate(splitDate);
            _hearingSchedule.HearingStartTime(date.ToString("HH:mm").Split(':'));
            InputHearingDuration(TestData.HearingSchedule.Duration);
            _hearingSchedule.HearingVenue(TestData.HearingSchedule.CourtAddress.ToList().Last());
            EnterRoom();
        }
        [Then(@"user should remain on hearing schedule page")]
        [When(@"Admin user is on hearing schedule page")]
        public void HearingSchedulePage()
        {
            _hearingSchedule.PageUrl(PageUri.HearingSchedulePage);
        }
        [When(@"Input date of hearing")]
        public void InputDateOfHearing()
        {
            _hearingSchedule.HearingDate();
        }
        [When(@"Input hearing start time")]
        public void InputHearingStartTime()
        {
            _hearingSchedule.HearingStartTime();
        }
        [When(@"Input hearing duration")]
        public void InputHearingDuration(string duration = "00:30")
        {
            _hearingSchedule.HearingDuration(duration);
        }
        [When(@"Select hearing venue")]
        public void SelectHearingVenue()
        {
            _hearingSchedule.HearingVenue();
        }
        [When(@"Enter room text as (.*)")]
        public void EnterRoom(string room = "")
        {
            _hearingSchedule.HearingRoom(room);
        }
        
        public void WhenUserProceedsToNextPage()
        {
            _hearingSchedule.HearingLocation().Should().BeGreaterOrEqualTo(2);
        }
        
        [When(@"user inputs a date in the past from the calendar")]
        public void WhenUserSelectsADateInThePastFromTheCalendar()
        {
            string[] date = DateTime.Now.AddDays(-1).ToString("dd/MM/yyyy").Split('/');
            _hearingSchedule.HearingDate(date);
            InputDateOfHearing();
            InputHearingStartTime();
            InputHearingDuration();
            SelectHearingVenue();
            EnterRoom();
        }

        [Then(@"an error message should be displayed as (.*)")]
        public void ThenAnErrorMessageShouldBeDisplayedAsPleaseEnterADateInTheFuture(string errormessage)
        {
            _hearingSchedule.ErrorDate().Should().Be(errormessage);
        }
        [Given(@"user adds hearing schedule")]
        [When(@"hearing schedule is updated")]
        public void WhenHearingScheduleIsUpdated()
        {
            HearingSchedulePage();
            DateTime date = DateTime.UtcNow.AddDays(2);
            string[] splitDate = date.ToString("dd/MM/yyyy").Split('/');
            _hearingSchedule.AddItems<string>("HearingDate", date.ToString("dddd dd MMMM yyyy , HH:mm"));
            _hearingSchedule.HearingDate(splitDate);
            _hearingSchedule.HearingStartTime(date.ToString("HH:mm").Split(':'));
            InputHearingDuration(TestData.HearingSchedule.Duration);
            _hearingSchedule.HearingVenue(TestData.HearingSchedule.CourtAddress.ToList().Last());
            EnterRoom(TestData.HearingSchedule.Room);
        }
    }
}