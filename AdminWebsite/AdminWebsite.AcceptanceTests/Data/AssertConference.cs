using System.Collections.Generic;
using System.Linq;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class AssertConference
    {
        public static void Assert(HearingDetailsResponse hearing, ConferenceDetailsResponse conference)
        {
            AssertConferenceDetails(hearing, conference);
            AssertEndpoints(hearing.Endpoints, conference.Endpoints);
            AssertConferenceParticipants(hearing.Participants, conference.Participants);
        }

        private static void AssertConferenceDetails(HearingDetailsResponse hearing, ConferenceDetailsResponse conference)
        {
            conference.Audio_recording_required.Should().Be(hearing.Audio_recording_required);
            conference.Case_name.Should().Be(hearing.Cases.First().Name);
            conference.Case_number.Should().Be(hearing.Cases.First().Number);
            conference.Case_type.Should().Be(hearing.Case_type_name);
            conference.Closed_date_time.Should().BeNull();
            conference.Current_status.Should().Be(ConferenceState.NotStarted);
            conference.Hearing_id.Should().Be(hearing.Id);
            conference.Hearing_venue_name.Should().Be(hearing.Hearing_venue_name);
            conference.Id.Should().NotBeEmpty();
            conference.Meeting_room.Admin_uri.Should().NotBeNullOrEmpty();
            conference.Meeting_room.Judge_uri.Should().NotBeNullOrEmpty();
            conference.Meeting_room.Participant_uri.Should().NotBeNullOrEmpty();
            conference.Meeting_room.Pexip_node.Should().NotBeNullOrEmpty();
            conference.Meeting_room.Pexip_self_test_node.Should().NotBeNullOrEmpty();
            conference.Scheduled_date_time.Should().Be(hearing.Scheduled_date_time);
            conference.Scheduled_duration.Should().Be(hearing.Scheduled_duration);
            conference.Started_date_time.Should().BeNull();
            conference.Meeting_room.Telephone_conference_id.Should().NotBeNullOrWhiteSpace();
        }

        private static void AssertEndpoints(IReadOnlyCollection<EndpointResponse2> hearingEndpoints, IEnumerable<EndpointResponse> conferenceEndpoints)
        {
            foreach (var conferenceEndpoint in conferenceEndpoints)
            {
                var hearingEndpoint = hearingEndpoints.First(x => x.Sip.Equals(conferenceEndpoint.Sip_address));
 
                if (conferenceEndpoint.Defence_advocate == null)
                {
                    hearingEndpoint.Defence_advocate_id.Should().BeNull();
                }

                conferenceEndpoint.Display_name.Should().Be(hearingEndpoint.Display_name);
                conferenceEndpoint.Id.Should().NotBeEmpty();
                conferenceEndpoint.Pin.Should().Be(hearingEndpoint.Pin);
                conferenceEndpoint.Status.Should().Be(EndpointState.NotYetJoined);
            }
        }

        private static void AssertConferenceParticipants(IReadOnlyCollection<ParticipantResponse> hearingParticipants, IEnumerable<ParticipantDetailsResponse> conferenceParticipants)
        {
            foreach (var conferenceParticipant in conferenceParticipants)
            {
                var hearingParticipant = hearingParticipants.First(x => x.Contact_email.Equals(conferenceParticipant.Contact_email));
                conferenceParticipant.Case_type_group.Should().Be(hearingParticipant.Case_role_name);
                if (conferenceParticipant.User_role != UserRole.Judge)
                {
                    conferenceParticipant.Contact_email.Should().Be(hearingParticipant.Contact_email);
                }
                conferenceParticipant.Contact_telephone.Should().Be(hearingParticipant.Telephone_number);
                conferenceParticipant.Current_status.Should().Be(ParticipantState.NotSignedIn);
                conferenceParticipant.Display_name.Should().Be(hearingParticipant.Display_name);
                conferenceParticipant.First_name.Should().Be(hearingParticipant.First_name);
                conferenceParticipant.Hearing_role.Should().Be(hearingParticipant.Hearing_role_name);
                conferenceParticipant.Id.Should().NotBeEmpty();
                conferenceParticipant.Last_name.Should().Be(hearingParticipant.Last_name);
                conferenceParticipant.Name.Should().Be($"{hearingParticipant.Title} {hearingParticipant.First_name} {hearingParticipant.Last_name}");
                conferenceParticipant.Ref_id.Should().Be(hearingParticipant.Id);
                conferenceParticipant.User_role.ToString().Should().Be(hearingParticipant.User_role_name);
                conferenceParticipant.Username.Should().Be(hearingParticipant.Username);
            }
        }
    }
}
