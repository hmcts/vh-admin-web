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
    }
}