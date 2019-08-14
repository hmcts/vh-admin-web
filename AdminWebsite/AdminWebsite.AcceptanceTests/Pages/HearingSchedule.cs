using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
using System;
using System.Linq;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class HearingSchedule : Common
    {
        public HearingSchedule(Browser browser) : base(browser)
        {
        }

        private static By HearingDateTextfield => By.Id("hearingDate");
        private static By HearingStartTimeTextfield => By.XPath("//input[@id='hearingStartTimeHour'or @id='hearingStartTimeMinute']");
        private static By HearingDurationTextfield => By.XPath("//input[@id='hearingDurationHour' or @id='hearingDurationMinute']");
        private static string[] CurrentTime() => DateTime.Now.AddMinutes(30).ToString("HH:mm").Split(':');
        private static readonly By Room = By.Id("court-room");
        private static readonly By ErrorDateText = By.Id("hearingDate-error");
        
        public void HearingDate(TargetBrowser browser, string currentdate = null)
        {
            if (currentdate == null)
                currentdate = DateFormats.GetHearingScheduledDate(browser);
            InputValues(HearingDateTextfield, currentdate);       
        }

        public void HearingStartTime(string[] currentTime = null)
        {
            if (currentTime == null)
                currentTime = CurrentTime();
            var startTime = GetListOfElements(HearingStartTimeTextfield).ToArray();
            for (var i = 0; i < startTime.Length; i++)
            {
                startTime[i].Clear();
                startTime[i].SendKeys(currentTime[i]);
            }
        }
        public void HearingDuration(string hearingDuration)
        {
            var duration = GetListOfElements(HearingDurationTextfield).ToArray();
            var hearingduration = hearingDuration.Split(':');
            for (var i = 0; i < duration.Length; i++)
            {
                duration[i].Clear();
                duration[i].SendKeys(hearingduration[i]);
            }
        }
        public void HearingVenue() => SelectFirstOption(CommonLocator.List("courtAddress"));
        public void HearingVenue(string venue) => SelectOption(CommonLocator.List("courtAddress"), venue);
        public void HearingRoom(string room) => ClearFieldInputValues(Room, room);
        public string ErrorDate() => GetElementText(ErrorDateText);
    }
}