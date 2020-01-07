using System;
using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
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
        private readonly HearingSchedulePage _hearingSchedulePage;
        private readonly CommonSharedSteps _commonSharedSteps;

        public HearingScheduleSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, HearingSchedulePage hearingSchedulePage, CommonSharedSteps commonSharedSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _hearingSchedulePage = hearingSchedulePage;
            _commonSharedSteps = commonSharedSteps;
        }

        [When(@"the user completes the hearing schedule form")]
        public void ProgressToNextPage()
        {
            SetHearingScheduleDetails();
            AddHearingDate();
            AddHearingTime();
            AddHearingScheduleDetails();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.NextButton).Click();
        }

        public void AddHearingDate()
        {
            var date = _c.Test.HearingSchedule.ScheduledDate.Date.ToString(DateFormats.FormatDateToLocalDateFormat(_c.AdminWebConfig.TestConfig.TargetBrowser));
            _browsers[_c.CurrentUser.Key].Clear(_hearingSchedulePage.HearingDateTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.HearingDateTextfield).SendKeys(date);
        }

        private void AddHearingTime()
        {
            _browsers[_c.CurrentUser.Key].Clear(_hearingSchedulePage.HearingStartTimeHourTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.HearingStartTimeHourTextfield).SendKeys(_c.Test.HearingSchedule.ScheduledDate.Hour.ToString());
            _browsers[_c.CurrentUser.Key].Clear(_hearingSchedulePage.HearingStartTimeMinuteTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.HearingStartTimeMinuteTextfield).SendKeys(_c.Test.HearingSchedule.ScheduledDate.Minute.ToString());
        }

        private void AddHearingScheduleDetails()
        {
            _browsers[_c.CurrentUser.Key].Clear(_hearingSchedulePage.HearingDurationHourTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.HearingDurationHourTextfield).SendKeys(_c.Test.HearingSchedule.DurationHours.ToString());
            _browsers[_c.CurrentUser.Key].Clear(_hearingSchedulePage.HearingDurationMinuteTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.HearingDurationMinuteTextfield).SendKeys(_c.Test.HearingSchedule.DurationMinutes.ToString());
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver, _hearingSchedulePage.CourtAddressDropdown, _c.Test.HearingSchedule.HearingVenue);
            _browsers[_c.CurrentUser.Key].Clear(_hearingSchedulePage.CourtRoomTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.CourtRoomTextfield).SendKeys(_c.Test.HearingSchedule.Room);
        }

        public void SetHearingScheduleDetails()
        {
            _c.Test.HearingSchedule.ScheduledDate = _c.Test.HearingSchedule.ScheduledDate == default ? DateTime.Today.AddDays(1).AddMinutes(-1) : DateTime.Today.AddDays(1).AddMinutes(-10);
            _c.Test.HearingSchedule.DurationHours = _c.Test.HearingSchedule.DurationHours == 0 ? _c.AdminWebConfig.TestConfig.TestData.HearingSchedule.DurationHours : 0;
            _c.Test.HearingSchedule.DurationMinutes = _c.Test.HearingSchedule.DurationMinutes == 0 ? _c.AdminWebConfig.TestConfig.TestData.HearingSchedule.DurationMinutes : 25;
            _c.Test.HearingSchedule.HearingVenue = _c.Test.HearingSchedule.HearingVenue != null ? "Manchester Civil and Family Justice Centre" : _c.AdminWebConfig.TestConfig.TestData.HearingSchedule.HearingVenue;
            _c.Test.HearingSchedule.Room = _c.Test.HearingSchedule.Room != null ? "2" : _c.AdminWebConfig.TestConfig.TestData.HearingSchedule.Room;
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
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.HearingDateError).Displayed.Should().BeTrue();
        }

        [Then(@"the user cannot proceed to the next page")]
        public void ThenTheUserCannotProceedToTheNextPage()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.NextButton).Click();
            _browsers[_c.CurrentUser.Key].PageUrl(Page.AssignJudge.Url, true);
        }
    }
}