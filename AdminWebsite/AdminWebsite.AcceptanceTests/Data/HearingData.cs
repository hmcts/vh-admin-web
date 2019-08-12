using System;
using System.Collections.Generic;
using Testing.Common;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class HearingData
    {
        public HearingData()
        {
            var fromRandomNumber = new Random();
            CaseName = $"Admin Web Automated Test {GenerateRandom.Letters(fromRandomNumber)}";
            CaseNumber = $"{GenerateRandom.CaseNumber(fromRandomNumber)}";
            UpdatedCaseName = $"{CaseName} Updated";
            UpdatedCaseNumber = $"{CaseNumber} Updated";
            CaseHearingType = "Application to Set Judgment Aside";
        }

        public string CaseName { get; set; }
        public string CaseNumber { get; set; }
        public string UpdatedCaseName { get; set; }
        public string UpdatedCaseNumber { get; set; }
        public string CaseHearingType { get; set; }
        public static IEnumerable<string> CaseTypes = new List<string>() { "Civil Money Claims", "Financial Remedy" };
    }
}
