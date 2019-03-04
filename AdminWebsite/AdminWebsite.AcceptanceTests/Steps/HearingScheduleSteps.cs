using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System;
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
            InputDateOfHearing();
            InputHearingStartTime();
            InputHearingDuration();
            SelectCourtAddress();
            EnterRoom();
        }
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
        [When(@"Select court address")]
        public void SelectCourtAddress()
        {
            _hearingSchedule.HearingVenue();
        }
        [When(@"Enter room text as (.*)")]
        public void EnterRoom(string room = TestData.HearingSchedule.Room)
        {
            _hearingSchedule.HearingRoom(room);
        }
        
        public void WhenUserProceedsToNextPage()
        {
            //_hearingSchedule.HearingLocation().Should().BeGreaterOrEqualTo(2);
        }
        
        [When(@"user selects a date in the past from the calendar")]
        public void WhenUserSelectsADateInThePastFromTheCalendar()
        {
            string[] date = DateTime.Now.AddDays(-1).ToString("dd/MM/yyyy").Split('/');
            _hearingSchedule.HearingDate(date);            
        }

        [Then(@"an error message should be displayed as (.*)")]
        public void ThenAnErrorMessageShouldBeDisplayedAsPleaseEnterADateInTheFuture(string errormessage)
        {
            _hearingSchedule.ErrorDate().Should().Be(errormessage);
        }
    }
}