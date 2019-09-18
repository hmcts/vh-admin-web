using System.Collections.Generic;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class HearingScheduleData
    {
        public HearingScheduleData()
        {
            Room = "Court Room 1";
            Duration = "01:30";
        }

        public static IEnumerable<string> CourtAddress = new List<string>()
        {
            "Birmingham Civil and Family Justice Centre",
            "Manchester Civil and Family Justice Centre"
        };

        public string Room { get; set; }
        public string Duration { get; set; }

        public string GetHearingDurationAsText()
        {
            int hours = int.Parse(Duration.Substring(0, 2));
            int minutes = int.Parse(Duration.Substring(3));
            return $"listed for {hours} {GetHoursText(hours)} {minutes} {GetMinutesText(minutes)}";
        }

        private string GetHoursText(int hours)
        {
            if (hours == 0)
                return "";
            else if (hours > 1)
                return "hours";
            else
                return "hour";
        }

        private string GetMinutesText(int minutes)
        {
            if (minutes == 0)
                return "";
            else if(minutes > 1)
                return "minutes";
            else
                return "minute";
        }
    }  
}