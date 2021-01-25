
using AdminWebsite.Extensions;
using AdminWebsite.VideoAPI.Client;
using FluentAssertions;
using NUnit.Framework;
using System;

namespace AdminWebsite.UnitTests.Extensions
{
    public class ConferenceDetailsResponseExtensionsTests
    {
        private ConferenceDetailsResponse conferenceDetailsResp;

        [SetUp]
        public void Init()
        {
            conferenceDetailsResp = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(),
                Hearing_id = Guid.NewGuid(),
                Meeting_room = new MeetingRoomResponse
                {
                    Admin_uri = "admin",
                    Judge_uri = "judge",
                    Participant_uri = "participant",
                    Pexip_node = "pexip",
                    Telephone_conference_id = "121212"
                }
            };
        }

        [Test]
        public void Should_return_false_MeetingRoom_is_valid()
        {  
            var result = conferenceDetailsResp.HasInvalidMeetingRoom();

            result.Should().BeFalse();
        }

        [Test]
        public void Should_return_true_MeetingRoom_is_null()
        {
            conferenceDetailsResp.Meeting_room = null;

            var result = conferenceDetailsResp.HasInvalidMeetingRoom();

            result.Should().BeTrue();
        }

        [Test]
        public void Should_return_true_AdminUri_is_null_or_empty()
        {
            conferenceDetailsResp.Meeting_room.Admin_uri = string.Empty;

            var result = conferenceDetailsResp.HasInvalidMeetingRoom();

            result.Should().BeTrue();
        }

        [Test]
        public void Should_return_true_JudgeUri_is_null_or_empty()
        {
            conferenceDetailsResp.Meeting_room.Judge_uri = string.Empty;

            var result = conferenceDetailsResp.HasInvalidMeetingRoom();

            result.Should().BeTrue();
        }

        [Test]
        public void Should_return_true_ParticipantUri_is_null_or_empty()
        {
            conferenceDetailsResp.Meeting_room.Participant_uri = string.Empty;

            var result = conferenceDetailsResp.HasInvalidMeetingRoom();

            result.Should().BeTrue();
        }

        [Test]
        public void Should_return_true_PexipNode_is_null_or_empty()
        {
            conferenceDetailsResp.Meeting_room.Pexip_node = string.Empty;

            var result = conferenceDetailsResp.HasInvalidMeetingRoom();

            result.Should().BeTrue();
        }

    }
}
