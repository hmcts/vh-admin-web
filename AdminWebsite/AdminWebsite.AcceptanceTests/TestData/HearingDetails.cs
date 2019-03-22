using System.Collections.Generic;

namespace AdminWebsite.AcceptanceTests.TestData
{
    public static class HearingDetails
    {
        public const string CaseName = "AutomatedTest";
        public const string CaseNumber = "AutomatedTest_BookAHearing";
        public const string CaseHearingType = "Application to Set Judgment Aside";
        public static IEnumerable<string> CaseType = new List<string>() { "Civil Money Claims", "Financial Remedy" };
    }
}
