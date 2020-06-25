using System;
using System.Collections.Generic;
using System.Threading;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class HearingScheduleSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly CommonSharedSteps _commonSharedSteps;

        public HearingScheduleSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, CommonSharedSteps commonSharedSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _commonSharedSteps = commonSharedSteps;
        }

        [When(@"the user completes the hearing schedule form")]
        public void ProgressToNextPage()
        {
            SetHearingScheduleDetails();
            AddHearingDate();
            AddHearingTime();
            AddHearingScheduleDetails();
            ClickNext();
        }

        public void AddHearingDate()
        {
            var date = _c.Test.HearingSchedule.ScheduledDate.Date.ToString(DateFormats.LocalDateFormat(_c.WebConfig.SauceLabsConfiguration.RunningOnSauceLabs()));
            _browsers[_c.CurrentUser.Key].Clear(HearingSchedulePage.HearingDateTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingSchedulePage.HearingDateTextfield).SendKeys(date);
        }

        private void AddHearingTime()
        {
            _browsers[_c.CurrentUser.Key].Clear(HearingSchedulePage.HearingStartTimeHourTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingSchedulePage.HearingStartTimeHourTextfield).SendKeys(_c.Test.HearingSchedule.ScheduledDate.Hour.ToString());
            _browsers[_c.CurrentUser.Key].Clear(HearingSchedulePage.HearingStartTimeMinuteTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingSchedulePage.HearingStartTimeMinuteTextfield).SendKeys(_c.Test.HearingSchedule.ScheduledDate.Minute.ToString());
        }

        private void AddHearingScheduleDetails()
        {
            _browsers[_c.CurrentUser.Key].Clear(HearingSchedulePage.HearingDurationHourTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingSchedulePage.HearingDurationHourTextfield).SendKeys(_c.Test.HearingSchedule.DurationHours.ToString());
            _browsers[_c.CurrentUser.Key].Clear(HearingSchedulePage.HearingDurationMinuteTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingSchedulePage.HearingDurationMinuteTextfield).SendKeys(_c.Test.HearingSchedule.DurationMinutes.ToString());
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver, HearingSchedulePage.CourtAddressDropdown, _c.Test.HearingSchedule.HearingVenue);
            _browsers[_c.CurrentUser.Key].Clear(HearingSchedulePage.CourtRoomTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingSchedulePage.CourtRoomTextfield).SendKeys(_c.Test.HearingSchedule.Room);
        }

        public void SetHearingScheduleDetails()
        {
            _c.Test.HearingSchedule.ScheduledDate = _c.Test.HearingSchedule.ScheduledDate == default ? DateTime.Today.AddDays(1).AddMinutes(-1) : DateTime.Today.AddDays(1).AddMinutes(-10);
            _c.Test.HearingSchedule.DurationHours = _c.Test.HearingSchedule.DurationHours == 0 ? _c.Test.TestData.HearingSchedule.DurationHours : 0;
            _c.Test.HearingSchedule.DurationMinutes = _c.Test.HearingSchedule.DurationMinutes == 0 ? _c.Test.TestData.HearingSchedule.DurationMinutes : 25;
            _c.Test.HearingSchedule.HearingVenue = _c.Test.HearingSchedule.HearingVenue != null ? "Manchester Civil and Family Justice Centre" : _c.Test.TestData.HearingSchedule.HearingVenue;
            _c.Test.HearingSchedule.Room = _c.Test.HearingSchedule.Room != null ? "2" : _c.Test.TestData.HearingSchedule.Room;
        }

        public void EditHearingSchedule()
        {
            Thread.Sleep(TimeSpan.FromSeconds(1));
            SetHearingScheduleDetails();
            AddHearingDate();
            AddHearingTime();
            AddHearingScheduleDetails();
            ClickNext();
            Thread.Sleep(TimeSpan.FromSeconds(1));
        }

        [When(@"the user attempts to set a date in the past")]
        public void WhenTheUserAttemptsToSetADateInThePast()
        {
            SetHearingScheduleDetails();
            _c.Test.HearingSchedule.ScheduledDate = DateTime.MinValue;
            AddHearingDate();
            AddHearingTime();
            AddHearingScheduleDetails();
        }

        [Then(@"an error message appears to enter a future date")]
        public void ThenAnErrorMessageAppearsToEnterAFutureDate()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingSchedulePage.HearingDateError).Displayed.Should().BeTrue();
        }

        [When(@"the user attempts to set a time in the past")]
        public void WhenTheUserAttemptsToSetATimeInThePast()
        {
            SetHearingScheduleDetails();
            _c.Test.HearingSchedule.ScheduledDate = DateTime.Today;
            AddHearingDate();
            AddHearingTime();
            AddHearingScheduleDetails();
        }

        [Then(@"an error message appears to enter a future time")]
        public void ThenAnErrorMessageAppearsToEnterAFutureTime()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingSchedulePage.HearingTimeError).Displayed.Should().BeTrue();
        }

        [Then(@"the user cannot proceed to the next page")]
        public void ThenTheUserCannotProceedToTheNextPage()
        {
            ClickNext();
            _browsers[_c.CurrentUser.Key].PageUrl(Page.AssignJudge.Url, true);
        }

        public void ClickNext()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingSchedulePage.NextButton);
            _browsers[_c.CurrentUser.Key].Click(HearingSchedulePage.NextButton);
        }
    }
}