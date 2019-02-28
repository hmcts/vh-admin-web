using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
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
        [When(@"hearing schedule form is filled")]
        public void WhenHearingScheduleFormIsFilled()
        {
            HearingSchedulePage();
            InputDateOfHearing();
            InputHearingStartTime();
            InputHearingDuration();
            SelectCourtAddress();
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
            _hearingSchedule.CourtAddress();
        }
    }
}