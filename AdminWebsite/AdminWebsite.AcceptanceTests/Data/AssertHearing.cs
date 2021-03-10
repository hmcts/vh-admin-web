using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Model.Participant;
using BookingsApi.Contract.Responses;
using FluentAssertions;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class AssertHearing
    {
        public static void AssertHearingDetails(HearingDetailsResponse hearing, Test testData)
        {
            AssertDetails(hearing, testData);
            AssertCreatedDate(hearing.CreatedDate, DateTime.UtcNow);
            AssertQuestionnaire(hearing, testData);
        }

        private static void AssertDetails(HearingDetailsResponse hearing, Test testData)
        {
            hearing.Cases.First().Name.Should().Contain(testData.HearingDetails.CaseName);
            hearing.Cases.First().Number.Should().Contain(testData.HearingDetails.CaseNumber);
            hearing.CaseTypeName.Should().Be(testData.HearingDetails.CaseType.Name);
            hearing.HearingRoomName.Should().Be(testData.HearingSchedule.Room);
            hearing.HearingTypeName.Should().Be(testData.HearingDetails.HearingType.Name);
            hearing.HearingVenueName.Should().Be(testData.HearingSchedule.HearingVenue);
            var deserializedObject = Newtonsoft.Json.JsonConvert.DeserializeObject<TestData.OtherInformationDetails>(hearing.OtherInformation);
            deserializedObject.OtherInformation.Should().Be(testData.TestData.OtherInformationDetails.OtherInformation);
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
                hearing.QuestionnaireNotRequired.Should().BeFalse();
            }
            else
            {
                hearing.QuestionnaireNotRequired.Should().BeTrue();
            }
        }

        public static void AssertScheduledDate(int day, DateTime actual, DateTime expected, bool isMultiDayHearing, bool isRunningOnSauceLabs)
        {
            expected = expected.AddDays(day - 1);

            if (isMultiDayHearing)
            {
                if (expected.DayOfWeek == DayOfWeek.Saturday || expected.DayOfWeek == DayOfWeek.Sunday)
                {
                    expected = expected.AddDays(2);
                }
            }

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
                var expectedParticipant = testHearingParticipants.First(x => x.Lastname.ToLower().Equals(actualParticipant.LastName.ToLower()));
                if (expectedParticipant.Role.ToLower() != "judge")
                {
                    actualParticipant.ContactEmail.Should().Be(expectedParticipant.AlternativeEmail);
                }

                if (!string.IsNullOrEmpty(expectedParticipant.Interpretee))
                {
                    var interpretee = participants.FirstOrDefault(p => p.DisplayName == expectedParticipant.Interpretee);
                    actualParticipant.LinkedParticipants.Single(p => p.LinkedId == interpretee.Id).Should().NotBeNull();
                    interpretee.LinkedParticipants.Single(p => p.LinkedId == actualParticipant.Id).Should().NotBeNull();
                }

                actualParticipant.CaseRoleName.Should().Be(expectedParticipant.CaseRoleName);
                // actualParticipant.Display_name.Should().Be($"{expectedParticipant.Firstname} {expectedParticipant.Role}"); TODO: removed as workaround for new user naming conventions
                actualParticipant.FirstName.Should().Be(expectedParticipant.Firstname);
                actualParticipant.HearingRoleName.Should().Be(expectedParticipant.HearingRoleName);
                actualParticipant.LastName.Should().Be(expectedParticipant.Lastname);
                var role = expectedParticipant.Role.ToLower().Equals("judge") ? "Judge" : expectedParticipant.Role;
                actualParticipant.UserRoleName.Should().Be(role);
                if (!expectedParticipant.HearingRoleName.Equals(PartyRole.Representative.Name)) continue;
                actualParticipant.Organisation.Should().Be(organisation);
                actualParticipant.Representee.Should().Be(expectedParticipant.Representee);
            }
        }

        public static void AssertUpdatedStatus(HearingDetailsResponse hearing, string updatedBy, DateTime updatedDate)
        {
            hearing.UpdatedBy.Should().Be(updatedBy);
            hearing.UpdatedDate.ToLocalTime().ToShortTimeString().Should().BeOneOf(updatedDate.ToLocalTime().AddMinutes(-1).ToShortTimeString(), updatedDate.ToLocalTime().ToShortTimeString(), updatedDate.ToLocalTime().AddMinutes(1).ToShortTimeString());
        }
    }
}
