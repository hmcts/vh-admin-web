using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class AssertConference
    {
        public static void Assert(HearingDetailsResponse hearing, ConferenceDetailsResponse conference)
        {
            AssertConferenceDetails(hearing, conference);
            AssertEndpoints(hearing.Endpoints, conference.Endpoints, hearing.Participants);
            AssertConferenceParticipants(hearing.Participants, conference.Participants);
        }

        private static void AssertConferenceDetails(HearingDetailsResponse hearing, ConferenceDetailsResponse conference)
        {
            conference.AudioRecordingRequired.Should().Be(hearing.AudioRecordingRequired);
            conference.CaseName.Should().Be(hearing.Cases.First().Name);
            conference.CaseNumber.Should().Be(hearing.Cases.First().Number);
            conference.CaseType.Should().Be(hearing.CaseTypeName);
            conference.ClosedDateTime.Should().BeNull();
            conference.CurrentStatus.Should().Be(ConferenceState.NotStarted);
            conference.HearingId.Should().Be(hearing.Id);
            conference.HearingVenueName.Should().Be(hearing.HearingVenueName);
            conference.Id.Should().NotBeEmpty();
            conference.MeetingRoom.AdminUri.Should().NotBeNullOrEmpty();
            conference.MeetingRoom.JudgeUri.Should().NotBeNullOrEmpty();
            conference.MeetingRoom.ParticipantUri.Should().NotBeNullOrEmpty();
            conference.MeetingRoom.PexipNode.Should().NotBeNullOrEmpty();
            conference.MeetingRoom.PexipSelfTestNode.Should().NotBeNullOrEmpty();
            conference.ScheduledDateTime.Should().Be(hearing.ScheduledDateTime);
            conference.ScheduledDuration.Should().Be(hearing.ScheduledDuration);
            conference.StartedDateTime.Should().BeNull();
            conference.MeetingRoom.TelephoneConferenceId.Should().NotBeNullOrWhiteSpace();
        }

        private static void AssertEndpoints(IReadOnlyCollection<BookingsApi.Contract.Responses.EndpointResponse> hearingEndpoints,
            IEnumerable<VideoApi.Contract.Responses.EndpointResponse> conferenceEndpoints, IReadOnlyCollection<ParticipantResponse> hearingParticipants)
        {
            foreach (var conferenceEndpoint in conferenceEndpoints)
            {
                var hearingEndpoint = hearingEndpoints.First(x => x.Sip.Equals(conferenceEndpoint.SipAddress));
 
                if (conferenceEndpoint.DefenceAdvocate == null)
                {
                    hearingEndpoint.DefenceAdvocateId.Should().BeNull();
                }
                else
                {
                    hearingParticipants.Any(x => x.Username.Equals(conferenceEndpoint.DefenceAdvocate, StringComparison.CurrentCultureIgnoreCase)).Should().BeTrue();
                }

                conferenceEndpoint.DisplayName.Should().Be(hearingEndpoint.DisplayName);
                conferenceEndpoint.Id.Should().NotBeEmpty();
                conferenceEndpoint.Pin.Should().Be(hearingEndpoint.Pin);
            }
        }

        private static void AssertConferenceParticipants(IReadOnlyCollection<ParticipantResponse> hearingParticipants, IEnumerable<ParticipantDetailsResponse> conferenceParticipants)
        {
            foreach (var conferenceParticipant in conferenceParticipants)
            {
                var hearingParticipant = hearingParticipants.First(x => x.ContactEmail.Equals(conferenceParticipant.ContactEmail));
                conferenceParticipant.CaseTypeGroup.Should().Be(hearingParticipant.CaseRoleName);
                if (conferenceParticipant.UserRole != UserRole.Judge)
                {
                    conferenceParticipant.ContactEmail.Should().Be(hearingParticipant.ContactEmail);
                }
                conferenceParticipant.ContactTelephone.Should().Be(hearingParticipant.TelephoneNumber);
                conferenceParticipant.CurrentStatus.Should().Be(ParticipantState.NotSignedIn);
                conferenceParticipant.DisplayName.Should().Be(hearingParticipant.DisplayName);
                conferenceParticipant.FirstName.Should().Be(hearingParticipant.FirstName);
                conferenceParticipant.HearingRole.Should().Be(hearingParticipant.HearingRoleName);
                conferenceParticipant.Id.Should().NotBeEmpty();
                conferenceParticipant.LastName.Should().Be(hearingParticipant.LastName);
                conferenceParticipant.Name.Should().Be($"{hearingParticipant.Title} {hearingParticipant.FirstName} {hearingParticipant.LastName}");
                conferenceParticipant.RefId.Should().Be(hearingParticipant.Id);
                conferenceParticipant.UserRole.ToString().Should().Be(hearingParticipant.UserRoleName);
                conferenceParticipant.Username.Should().Be(hearingParticipant.Username);
            }
        }
    }
}
