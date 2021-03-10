using System.Collections.Generic;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Data.TestData;
using AdminWebsite.AcceptanceTests.Data.TestData;
using BookingsApi.Contract.Responses;
using VideoApi.Contract.Responses;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class Test
    {
        public string CreatedBy { get; set; }
        public List<UserAccount> HearingParticipants { get; set; }
        public HearingDetails HearingDetails { get; set; }
        public HearingSchedule HearingSchedule { get; set; }
        public AssignJudge AssignJudge { get; set; }
        public AddParticipant AddParticipant { get; set; }
        public bool SubmittedAndCreatedNewAadUsers { get; set; } = false;
        public CommonData CommonData { get; set; }
        public DefaultData TestData { get; set; }
        public ConferenceDetailsResponse ConferenceResponse { get; set; }
        public HearingDetailsResponse HearingResponse { get; set; }
        public VideoAccessPoints VideoAccessPoints { get; set; }
        public int PasswordResetNotificationCount { get; set; }
    }
}
