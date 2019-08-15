using System.Collections.Generic;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class TestData
    {
        public List<ParticipantData> ParticipantData { get; set; }
        public HearingData HearingData { get; set; }
        public HearingScheduleData HearingScheduleData { get; set; }
        public ErrorMessages ErrorMessages { get; set; }

        public TestData()
        {
            ParticipantData = new List<ParticipantData>();
            HearingData = new HearingData();
            HearingScheduleData = new HearingScheduleData();
            ErrorMessages = new ErrorMessages();
        }
    }
}
