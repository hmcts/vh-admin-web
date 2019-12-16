using System;
using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
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
            SetHearingDate();
            SetHearingTime();
            SetHearingScheduleDetails();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.NextButton).Click();
        }

        public void SetHearingDate()
        {
            _c.Test.Hearing.ScheduledDate = DateTime.Now.ToLocalTime().AddDays(1).AddMinutes(-1);
            var date = _c.Test.Hearing.ScheduledDate.Date.ToString(DateFormats.FormatDateToLocalDateFormat(_c.AdminWebConfig.TestConfig.TargetBrowser,
                 _c.AdminWebConfig.SauceLabsConfiguration.RunningOnSauceLabs()));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.HearingDateTextfield).SendKeys(date);
        }

        private void SetHearingTime()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.HearingStartTimeHourTextfield).SendKeys(_c.Test.Hearing.ScheduledDate.Hour.ToString());
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.HearingStartTimeMinuteTextfield).SendKeys(_c.Test.Hearing.ScheduledDate.Minute.ToString());
        }

        private void SetHearingScheduleDetails()
        {
            var durationHours = _c.AdminWebConfig.TestConfig.TestData.HearingSchedule.DurationHours;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.HearingDurationHourTextfield).SendKeys(durationHours.ToString());

            var durationMinutes = _c.AdminWebConfig.TestConfig.TestData.HearingSchedule.DurationMinutes;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.HearingDurationMinuteTextfield).SendKeys(durationMinutes.ToString());

            var hearingVenue = _c.AdminWebConfig.TestConfig.TestData.HearingSchedule.HearingVenue;
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver, _hearingSchedulePage.CourtAddressDropdown, hearingVenue);

            var room = _c.AdminWebConfig.TestConfig.TestData.HearingSchedule.Room;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingSchedulePage.CourtRoomTextfield).SendKeys(room);
        }
    }
}
