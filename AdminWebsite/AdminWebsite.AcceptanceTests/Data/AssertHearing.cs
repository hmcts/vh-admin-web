using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Model.Participant;
using AdminWebsite.BookingsAPI.Client;
using FluentAssertions;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class AssertHearing
    {
        private static HearingDetailsResponse _hearing;
        private static string _createdBy;
        private static Test _test;

        public AssertHearing WithHearing(HearingDetailsResponse hearing)
        {
            _hearing = hearing;
            return this;
        }

        public AssertHearing CreatedBy(string createdBy)
        {
            _createdBy = createdBy;
            return this;
        }

        public AssertHearing WithTestData(Test test)
        {
            _test = test;
            return this;
        }

        public void AssertHearingDataMatches()
        {
            _hearing.Cases.First().Name.Should().Be(_test.HearingDetails.CaseName);
            _hearing.Cases.First().Number.Should().Be(_test.HearingDetails.CaseNumber);
            _hearing.Case_type_name.Should().Be(_test.HearingDetails.CaseType.Name);
            _hearing.Created_by.Should().Be(_createdBy);
            VerifyDatesMatch(_hearing.Created_date, DateTime.Now);
            _hearing.Hearing_room_name.Should().Be(_test.HearingSchedule.Room);
            _hearing.Hearing_type_name.Should().Be(_test.HearingDetails.HearingType.Name);
            _hearing.Hearing_venue_name.Should().Be(_test.HearingSchedule.HearingVenue);
            _hearing.Other_information.Should().Be(_test.OtherInformation);
            _hearing.Questionnaire_not_required.Should().Be(_test.HearingDetails.DoNotSendQuestionnaires);
            VerifyDatesMatch(_hearing.Scheduled_date_time, _test.HearingSchedule.ScheduledDate);
            VerifyTimeSpansMatch(_hearing.Scheduled_duration, _test.HearingSchedule.DurationHours, _test.HearingSchedule.DurationMinutes);
        }

        public void AssertParticipantDataMatches(List<UserAccount> testHearingParticipants)
        {
            _hearing.Participants.Count.Should().Be(testHearingParticipants.Count);
            foreach (var actualParticipant in _hearing.Participants)
            {
                var expectedParticipant = testHearingParticipants.First(x => x.Lastname.ToLower().Equals(actualParticipant.Last_name.ToLower()));
                actualParticipant.Contact_email.Should().Be(expectedParticipant.AlternativeEmail);
                actualParticipant.Case_role_name.Should().Be(expectedParticipant.CaseRoleName);
                actualParticipant.Display_name.Should().Be(expectedParticipant.DisplayName);
                actualParticipant.First_name.Should().Be(expectedParticipant.Firstname);
                actualParticipant.Hearing_role_name.Should().Be(expectedParticipant.HearingRoleName);
                actualParticipant.Last_name.Should().Be(expectedParticipant.Lastname);
                var role = expectedParticipant.Role.ToLower().Equals("clerk") ? "Judge" : expectedParticipant.Role;
                actualParticipant.User_role_name.Should().Be(role);
                if (!expectedParticipant.HearingRoleName.Equals(PartyRole.Representative.Name)) continue;
                actualParticipant.Organisation.Should().Be(_test.AddParticipant.Participant.Organisation);
                actualParticipant.Representee.Should().Be(expectedParticipant.Representee);
                actualParticipant.Reference.Should().Be(_test.AddParticipant.Participant.Reference);
            }
        }

        public void AssertHearingStatus(BookingStatus expectedStatus)
        {
            _hearing.Status.Should().Be(expectedStatus);
        }

        public void AssertUpdatedStatus(string updatedBy, DateTime updatedDate)
        {
            _hearing.Updated_by.Should().Be(updatedBy);
            _hearing.Updated_date.ToLocalTime().ToShortTimeString().Should().BeOneOf(updatedDate.ToLocalTime().AddMinutes(-1).ToShortTimeString(), updatedDate.ToLocalTime().ToShortTimeString(), updatedDate.ToLocalTime().AddMinutes(1).ToShortTimeString());
        }

        public static void VerifyTimeSpansMatch(int? actual, int hours, int minutes)
        {
            if (actual != null)
            {
                var actualDuration = TimeSpan.FromMinutes(actual.Value);
                var expectedDuration = TimeSpan.FromHours(hours).Add(TimeSpan.FromMinutes(minutes));
                actualDuration.Should().Be(expectedDuration);
            }
            else
            {
                throw new DataException("Scheduled duration cannot be null");
            }

        }

        private static void VerifyDatesMatch(DateTime? expected, DateTime actual)
        {
            if (expected != null)
            {
                expected.Value.ToShortDateString().Should().Be(actual.ToUniversalTime().ToShortDateString());
                expected.Value.ToShortTimeString().Should().BeOneOf(actual.ToUniversalTime().ToShortTimeString(), actual.ToUniversalTime().AddMinutes(-1).ToShortTimeString());
            }
            else
            {
                throw new DataException("Scheduled time cannot be null");
            }
        }
    }
}
