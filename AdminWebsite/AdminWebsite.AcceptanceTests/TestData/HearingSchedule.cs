using System.Collections.Generic;

namespace AdminWebsite.AcceptanceTests.TestData
{
    public static class HearingSchedule
    {
        public static IEnumerable<string> CourtAddress = new List<string>(){"Birmingham Civil and Family Justice Centre", "Manchester Civil and Family Justice Centre" };
        public const string Room = "Court Room 1";
        //  public string HearingDate = 
        public const string Duration = "01:30";
    }
}