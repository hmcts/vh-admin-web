using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Model.Participant;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;
using TimeZone = AcceptanceTests.Common.Data.Time.TimeZone;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class AssertHearing
    {
        private static HearingDetailsResponse _hearing;
        private static string _createdBy;
        private static Test _test;
        private TimeZone _timeZone;

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

        public AssertHearing WithTimeZone(TimeZone timeZone)
        {
            _timeZone = timeZone;
            return this;
        }

        public void AssertHearingDataMatches()
        {
            _hearing.Cases.First().Name.Should().Be(_test.HearingDetails.CaseName);
            _hearing.Cases.First().Number.Should().Be(_test.HearingDetails.CaseNumber);
            _hearing.Case_type_name.Should().Be(_test.HearingDetails.CaseType.Name);
            _hearing.Created_by.Should().Be(_createdBy);
            VerifyCreatedDate(_hearing.Created_date, DateTime.UtcNow);
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
                var role = expectedParticipant.Role.ToLower().Equals("judge") ? "Judge" : expectedParticipant.Role;
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

        public static void VerifyTimeSpansMatch(int actual, int hours, int minutes)
        {
            var actualDuration = TimeSpan.FromMinutes(actual);
            var expectedDuration = TimeSpan.FromHours(hours).Add(TimeSpan.FromMinutes(minutes));
            actualDuration.Should().Be(expectedDuration);
        }

        private static void VerifyCreatedDate(DateTime actual, DateTime expected)
        {
            actual.ToShortDateString().Should().Be(expected.ToShortDateString());
            actual.ToShortTimeString().Should().BeOneOf(
                expected.AddMinutes(-3).ToShortTimeString(),
                expected.AddMinutes(-2).ToShortTimeString(),
                expected.AddMinutes(-1).ToShortTimeString(),
                expected.ToShortTimeString());
        }

        private void VerifyDatesMatch(DateTime actual, DateTime expected)
        {
            expected = _timeZone.AdjustAdminWeb(expected);
            actual.ToShortDateString().Should().Be(expected.ToShortDateString());
            actual.ToShortTimeString().Should().BeOneOf(
                expected.AddMinutes(-3).ToShortTimeString(),
                                 expected.AddMinutes(-2).ToShortTimeString(), 
                                 expected.AddMinutes(-1).ToShortTimeString(), 
                                 expected.ToShortTimeString());
        }
    }
}
