using System.Collections.Generic;

namespace AdminWebsite.AcceptanceTests.TestData
{
    public static class HearingSchedule
    {
        public static IEnumerable<string> CourtAddress = new List<string>(){"Birmingham Civil and Family Justice Centre", "Manchester Civil and Family Justice Centre" };
        public const string Room = "Court Room 1";
        public const string Duration = "01:30";
        public const string Duration1 = "00:30";
    }
}