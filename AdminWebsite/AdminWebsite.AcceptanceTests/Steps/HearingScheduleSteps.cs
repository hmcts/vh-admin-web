using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System;
using System.Linq;
using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.AcceptanceTests.Data;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingScheduleSteps
    {
        private readonly TestContext _context;
        private readonly HearingSchedule _hearingSchedule;

        public HearingScheduleSteps(TestContext context, HearingSchedule hearingSchedule)
        {
            _context = context;
            _hearingSchedule = hearingSchedule;
        }

        [When(@"user enters video hearing schedule details")]
        [When(@"hearing schedule form is filled")]
        public void WhenHearingScheduleFormIsFilled()
        {
            HearingSchedulePage();
            var date = DateTime.UtcNow.AddDays(2);
            _hearingSchedule.AddItems<string>("HearingDate", date.ToString("dddd dd MMMM yyyy, h:mmtt").ToLower());
            _hearingSchedule.HearingDate(date.ToString("yyyy-MM-dd"));
            _hearingSchedule.HearingStartTime(date.ToString("HH:mm").Split(':'));
            InputHearingDuration(_context.TestData.HearingScheduleData.Duration);
            _hearingSchedule.HearingVenue(HearingScheduleData.CourtAddress.Last());
            EnterRoom();
        }

        [When(@"Admin user is on hearing schedule page")]
        [Then(@"user should remain on hearing schedule page")]
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
        
        [When(@"user inputs a date in the past from the calendar")]
        public void WhenUserSelectsADateInThePastFromTheCalendar()
        {
            var date = DateTime.Now.AddDays(-1).ToString("yyyy-MM-dd");
            _hearingSchedule.HearingDate(date);
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
            var date = DateTime.UtcNow.AddDays(2);
            var splitDate = date.ToString("yyyy-MM-dd");
            _hearingSchedule.AddItems<string>("HearingDate", date.ToString("dddd dd MMMM yyyy, h:mmtt").ToLower());
            _hearingSchedule.HearingDate(splitDate);
            _hearingSchedule.HearingStartTime(date.ToString("HH:mm").Split(':'));
            InputHearingDuration(_context.TestData.HearingScheduleData.Duration);
            _hearingSchedule.HearingVenue(HearingScheduleData.CourtAddress.Last());
            EnterRoom(_context.TestData.HearingScheduleData.Room);
        }
    }
}