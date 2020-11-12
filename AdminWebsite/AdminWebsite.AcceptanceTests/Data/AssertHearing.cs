using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Model.Participant;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class AssertHearing
    {
        public static void AssertHearingDetails(HearingDetailsResponse hearing, Test testData)
        {
            AssertDetails(hearing, testData);
            AssertCreatedDate(hearing.Created_date, DateTime.UtcNow);
            AssertQuestionnaire(hearing, testData);
        }

        private static void AssertDetails(HearingDetailsResponse hearing, Test testData)
        {
            hearing.Cases.First().Name.Should().Contain(testData.HearingDetails.CaseName);
            hearing.Cases.First().Number.Should().Contain(testData.HearingDetails.CaseNumber);
            hearing.Case_type_name.Should().Be(testData.HearingDetails.CaseType.Name);
            hearing.Hearing_room_name.Should().Be(testData.HearingSchedule.Room);
            hearing.Hearing_type_name.Should().Be(testData.HearingDetails.HearingType.Name);
            hearing.Hearing_venue_name.Should().Be(testData.HearingSchedule.HearingVenue);
            hearing.Other_information.Should().Be(testData.OtherInformation);

        }

        private static void AssertCreatedDate(DateTime actual, DateTime expected)
        {
            actual.ToShortDateString().Should().Be(expected.ToShortDateString());
            actual.ToShortTimeString().Should().BeOneOf(
                expected.AddMinutes(-3).ToShortTimeString(),
                expected.AddMinutes(-2).ToShortTimeString(),
                expected.AddMinutes(-1).ToShortTimeString(),
                expected.ToShortTimeString());
        }

        private static void AssertQuestionnaire(HearingDetailsResponse hearing, Test testData)
        {
            if (!hearing.Cases.First().Name.Contains("Day") || hearing.Cases.First().Name.Contains("Day 1 of"))
            {
                hearing.Questionnaire_not_required.Should().Be(testData.HearingDetails.DoNotSendQuestionnaires);
            }
            else
            {
                hearing.Questionnaire_not_required.Should().BeTrue();
            }
        }

        public static void AssertScheduledDate(DateTime actual, DateTime expected, bool isRunningOnSauceLabs)
        {
            actual.ToShortDateString().Should().Be(expected.ToShortDateString());

            if (isRunningOnSauceLabs)
            {
                actual.ToShortTimeString().Should().BeOneOf(
                    expected.AddMinutes(-3).ToShortTimeString(),
                    expected.AddMinutes(-2).ToShortTimeString(),
                    expected.AddMinutes(-1).ToShortTimeString(),
                    expected.ToShortTimeString());
            }
        }

        public static void AssertTimeSpansMatch(int actual, int hours, int minutes, bool isMultiDayHearing)
        {
            var actualDuration = TimeSpan.FromMinutes(actual);
            var expectedDuration = isMultiDayHearing ? TimeSpan.FromHours(8) : TimeSpan.FromHours(hours).Add(TimeSpan.FromMinutes(minutes));
            actualDuration.Should().Be(expectedDuration);
        }

        public static void AssertCreatedBy(string actual, string expected)
        {
            actual.Should().Be(expected);
        }

        public static void AssertHearingParticipants(List<ParticipantResponse> participants, List<UserAccount> testHearingParticipants, string organisation)
        {
            participants.Count.Should().Be(testHearingParticipants.Count);
            foreach (var actualParticipant in participants)
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
                actualParticipant.Organisation.Should().Be(organisation);
                actualParticipant.Representee.Should().Be(expectedParticipant.Representee);
            }
        }

        public static void AssertUpdatedStatus(HearingDetailsResponse hearing, string updatedBy, DateTime updatedDate)
        {
            hearing.Updated_by.Should().Be(updatedBy);
            hearing.Updated_date.ToLocalTime().ToShortTimeString().Should().BeOneOf(updatedDate.ToLocalTime().AddMinutes(-1).ToShortTimeString(), updatedDate.ToLocalTime().ToShortTimeString(), updatedDate.ToLocalTime().AddMinutes(1).ToShortTimeString());
        }
    }
}
