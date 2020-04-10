using System;
using AdminWebsite.AcceptanceTests.Features;

namespace AdminWebsite.AcceptanceTests.Data.TestData
{
    public class DefaultData
    {
        public HearingDetails HearingDetails { get; set; }
        public HearingSchedule HearingSchedule { get; set; }
        public AssignJudge AssignJudge { get; set; }
        public AddParticipant AddParticipant { get; set; }
        public OtherInformation OtherInformation { get; set; }
        public Questionnaire Questionnaire { get; set; }
        public BookingDetailsPage BookingDetailsPage { get; set; }
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
    }

    public class AssignJudge
    {
        public bool AudioRecord { get; set; }
    }

    public class AddParticipant
    {
        public Participant Participant { get; set; }
        public Address Address { get; set; }
    }

    public class Participant
    {
        public string NewUserPrefix { get; set; }
        public string Title { get; set; }
        public string Phone { get; set; }
        public string Organisation { get; set; }
        public string Reference { get; set; }
    }

    public class Address
    {
        public string HouseNumber { get; set; }
        public string Street { get; set; }
        public string City { get; set; }
        public string County { get; set; }
        public string Postcode { get; set; }
    }

    public class OtherInformation
    {
        public string Other { get; set; }
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
}
