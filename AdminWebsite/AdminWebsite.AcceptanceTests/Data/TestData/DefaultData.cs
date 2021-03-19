using System;

namespace AdminWebsite.AcceptanceTests.Data.TestData
{
    public class DefaultData
    {
        public HearingDetails HearingDetails { get; set; }
        public HearingSchedule HearingSchedule { get; set; }
        public AssignJudge AssignJudge { get; set; }
        public AddParticipant AddParticipant { get; set; }
        public OtherInformationDetails OtherInformationDetails { get; set; }
        public Questionnaire Questionnaire { get; set; }
        public BookingDetailsPage BookingDetailsPage { get; set; }
        public VideoAccessPoints VideoAccessPoints { get; set; }
    }

    public class HearingDetails
    {
        public string CaseType { get; set; }
        public string HearingType { get; set; }
        public bool DoNotSendQuestionnaires { get; set; }
    }

    public class HearingSchedule
    {
        public int DurationHours { get; set; } = 0;
        public int DurationMinutes { get; set; } = 0;
        public string HearingVenue { get; set; }
        public string Room { get; set; }
        public DateTime ScheduledDate { get; set; }
        public int NumberOfMultiDays { get; set; }
        public bool MultiDays { get; set; }
        public DateTime EndHearingDate { get; set; }
    }

    public class AssignJudge
    {
        public bool AudioRecord { get; set; }
    }

    public class AddParticipant
    {
        public Participant Participant { get; set; }
    }

    public class Participant
    {
        public string NewUserPrefix { get; set; }
        public string Title { get; set; }
        public string Phone { get; set; }
        public string Organisation { get; set; }
    }

    public class OtherInformationDetails
    {
        public string OtherInformation { get; set; }
        public string OtherInformationText { get; set; }
    }

    public class Questionnaire
    {
        public string SelfTestQuestion1 { get; set; }
        public string SelfTestQuestion2 { get; set; }
        public string IndividualQuestion { get; set; }
        public string RepresentativeQuestion { get; set; }
        public string ExtendedAnswer { get; set; }
        public string UnansweredQuestion { get; set; }
    }

    public class BookingDetailsPage
    {
        public string CancelReason { get; set; }
        public string CancelReason2 { get; set; }
        public string DetailReason { get; set; }
    }

    public class VideoAccessPoints
    {
        public string DisplayName { get; set; }
    }
}
