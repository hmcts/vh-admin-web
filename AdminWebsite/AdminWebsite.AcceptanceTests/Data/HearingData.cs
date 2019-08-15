using System;
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
            CaseHearingType = "Application to Set Judgment Aside";
        }

        public string CaseName { get; set; }
        public string CaseNumber { get; set; }
        public string CaseHearingType { get; set; }

        public string Update(string value)
        {
            return $"{value} Updated";
        }
    }
}
