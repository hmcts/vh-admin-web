using System.Collections.Generic;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Data.TestData;
using AdminWebsite.AcceptanceTests.Data.TestData;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class Test
    {
        public List<UserAccount> HearingParticipants { get; set; }
        public HearingDetails HearingDetails { get; set; }
        public HearingSchedule HearingSchedule { get; set; }
        public AssignJudge AssignJudge { get; set; }
        public string OtherInformation { get; set; }
        public AddParticipant AddParticipant { get; set; }
        public bool SubmittedAndCreatedNewAadUsers { get; set; } = false;
        public CommonData CommonData { get; set; }
        public DefaultData TestData { get; set; }
    }
}
