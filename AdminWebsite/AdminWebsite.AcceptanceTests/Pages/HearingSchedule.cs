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
        private string CurrentDate() => DateTime.Now.ToString("dd/MM/yyyy").Replace("/", String.Empty);
        private string[] CurrentTime() => DateTime.Now.AddMinutes(30).ToString("HH:mm").Split(':');
        private By _room = By.Id("court-room");
        private By _errorDate = By.Id("hearingDate-error");

        public void HearingDate(string currentdate = null)
        {
            if (currentdate == null)
              currentdate = CurrentDate();
            ClickElement(_hearingDate);
            InputValues(_hearingDate, currentdate);
        }
        public void HearingStartTime(string[] currentTime = null)
        {
            if (currentTime == null)
                currentTime = CurrentTime();
            var startTime = GetListOfElements(_hearingStartTime).ToArray();
            for (var i = 0; i < startTime.Length; i++)
            {
                startTime[i].Clear();
                startTime[i].SendKeys(currentTime[i]);
            }
        }
        public void HearingDuration(string hearingDuration)
        {
            var duration = GetListOfElements(_hearingDuration).ToArray();
            var hearingduration = hearingDuration.Split(':');
            for (var i = 0; i < duration.Length; i++)
            {
                duration[i].Clear();
                duration[i].SendKeys(hearingduration[i]);
            }
        }
        public void HearingVenue() => SelectOption(CommonLocator.List("courtAddress"));
        public void HearingVenue(string venue) => SelectOption(CommonLocator.List("courtAddress"), venue);
        public int HearingLocation() => GetListOfElements(CommonLocator.List("courtAddress")).ToList().Count();
        public void HearingRoom(string room) => ClearFieldInputValues(_room, room);
        public string ErrorDate() => GetElementText(_errorDate);
    }
}