using AcceptanceTests.Common.Model.Case;
using AcceptanceTests.Common.Model.Hearing;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class HearingDetails
    {
        public string CaseNumber { get; set; }
        public string CaseName { get; set; }
        public HearingType HearingType { get; set; }
        public CaseType CaseType { get; set; }
        public bool DoNotSendQuestionnaires { get; set; }
    }
}
