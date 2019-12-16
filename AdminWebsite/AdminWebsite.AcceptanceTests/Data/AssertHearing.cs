using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Model.Participant;
using AdminWebsite.AcceptanceTests.Data.TestData;
using AdminWebsite.BookingsAPI.Client;
using FluentAssertions;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class AssertHearing
    {
        private static HearingDetailsResponse _hearing;
        private static string _createdBy;
        private static DefaultData _default;

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

        public AssertHearing WithTestData(DefaultData defaultData)
        {
            _default = defaultData;
            return this;
        }

        public void AssertHearingDataMatches(Hearing testHearing)
        {
            _hearing.Cases.First().Name.Should().Be(testHearing.CaseName);
            _hearing.Cases.First().Number.Should().Be(testHearing.CaseNumber);
            _hearing.Case_type_name.Should().Be(_default.HearingDetails.CaseType);
            _hearing.Created_by.Should().Be(_createdBy);
            VerifyDatesMatch(_hearing.Created_date, DateTime.Now);
            _hearing.Hearing_room_name.Should().Be(_default.HearingSchedule.Room);
            _hearing.Hearing_type_name.Should().Be(testHearing.HearingType.Name);
            _hearing.Hearing_venue_name.Should().Be(_default.HearingSchedule.HearingVenue);
            _hearing.Other_information.Should().Be(_default.OtherInformation.Other);
            _hearing.Questionnaire_not_required.Should().Be(_default.HearingDetails.DoNotSendQuestionnaires);
            VerifyDatesMatch(_hearing.Scheduled_date_time, testHearing.ScheduledDate);
            VerifyTimeSpansMatch(_hearing.Scheduled_duration, _default.HearingSchedule.DurationHours, _default.HearingSchedule.DurationMinutes);
        }

        public void AssertParticipantDataMatches(List<UserAccount> testHearingParticipants)
        {
            _hearing.Participants.Count.Should().Be(testHearingParticipants.Count);
            foreach (var actualParticipant in _hearing.Participants)
            {
                var expectedParticipant = testHearingParticipants.First(x => x.DisplayName.ToLower().Equals(actualParticipant.Display_name.ToLower()));
                actualParticipant.Contact_email.Should().Be(expectedParticipant.AlternativeEmail);
                actualParticipant.Case_role_name.Should().Be(expectedParticipant.CaseRoleName);
                actualParticipant.Display_name.Should().Be(expectedParticipant.DisplayName);
                actualParticipant.First_name.Should().Be(expectedParticipant.Firstname);
                actualParticipant.Hearing_role_name.Should().Be(expectedParticipant.HearingRoleName);
                actualParticipant.Last_name.Should().Be(expectedParticipant.Lastname);
                var role = expectedParticipant.Role.ToLower().Equals("clerk") ? "Judge" : expectedParticipant.Role;
                actualParticipant.User_role_name.Should().Be(role);
                if (!expectedParticipant.HearingRoleName.Equals(PartyRole.Solicitor.Name)) continue;
                actualParticipant.Organisation.Should().Be(_default.AddParticipant.Participant.Organisation);
                actualParticipant.Representee.Should().Be(expectedParticipant.Representee);
                actualParticipant.Solicitor_reference.Should().Be(_default.AddParticipant.Participant.SolicitorsReference);
            }
        }

        public void AssertHearingStatus(HearingDetailsResponseStatus expectedStatus)
        {
            _hearing.Status.Should().Be(expectedStatus);
        }

        public void AssertUpdatedStatus(string updatedBy, DateTime? updatedDate)
        {
            _hearing.Updated_by.Should().Be(updatedBy);
            _hearing.Updated_date.Should().Be(updatedDate);
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
