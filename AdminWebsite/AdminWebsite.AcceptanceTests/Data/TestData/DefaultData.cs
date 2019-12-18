using System;

namespace AdminWebsite.AcceptanceTests.Data.TestData
{
    public class DefaultData
    {
        public HearingDetails HearingDetails { get; set; }
        public HearingSchedule HearingSchedule { get; set; }
        public AddParticipant AddParticipant { get; set; }
        public OtherInformation OtherInformation { get; set; }
        public Questionnaire Questionnaire { get; set; }
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
        public string SolicitorsReference { get; set; }
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
        public string Question1 { get; set; }
        public string Question2 { get; set; }
    }
}
