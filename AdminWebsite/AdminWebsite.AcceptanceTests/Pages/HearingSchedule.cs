using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
using System;
using System.Linq;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class HearingSchedule : Common
    {
        public HearingSchedule(BrowserContext browserContext) : base(browserContext)
        {
        }

        private By _hearingDate => By.Id("hearingDate");
        private By _hearingStartTime => By.XPath("//input[@id='hearingStartTimeHour'or @id='hearingStartTimeMinute']");
        private By _hearingDuration => By.XPath("//input[@id='hearingDurationHour' or @id='hearingDurationMinute']");
        private string[] CurrentDate() => DateTime.Now.ToString("dd/MM/yyyy").Split('/');
        private string[] CurrentTime() => DateTime.Now.AddMinutes(30).ToString("HH:mm").Split(':');

        public void HearingDate()
        {            
            ClickElement(_hearingDate);
            foreach (var date in CurrentDate())
            {
                InputValues(_hearingDate, date);
            }
        }
        public void HearingStartTime()
        {
            var currentTime = CurrentTime();
            var startTime = GetListOfElements(_hearingStartTime).ToArray();            
            for (var i = 0; i < startTime.Length; i++)
            {
                startTime[i].SendKeys(currentTime[i]);
            }
        }
        public void HearingDuration(string hearingDuration)
        {
            var duration = GetListOfElements(_hearingDuration).ToArray();
            var hearingduration = hearingDuration.Split(':');
            for (var i = 0; i < duration.Length; i++)
            {
                duration[i].SendKeys(hearingduration[i]);
            }
        }
        public void CourtAddress(string option) => SelectOption(CommonLocator.List("courtAddress"), option);
    }
}