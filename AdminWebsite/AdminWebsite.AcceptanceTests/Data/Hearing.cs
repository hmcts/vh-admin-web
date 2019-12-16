using System;
using AcceptanceTests.Common.Model.Case;
using AcceptanceTests.Common.Model.Hearing;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class Hearing
    {
        public string CaseNumber { get; set; }
        public string CaseName { get; set; }
        public DateTime ScheduledDate { get; set; }
        public HearingType HearingType { get; set; }
        public CaseType CaseType { get; set; }
    }
}
