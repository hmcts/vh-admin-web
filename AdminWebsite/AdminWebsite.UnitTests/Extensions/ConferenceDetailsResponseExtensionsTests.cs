using NUnit.Framework;
using System;
using AdminWebsite.Extensions;
using FluentAssertions;
using VideoApi.Contract.Responses;

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
                HearingId = Guid.NewGuid(),
                MeetingRoom = new MeetingRoomResponse
                {
                    AdminUri = "admin",
                    JudgeUri = "judge",
                    ParticipantUri = "participant",
                    PexipNode = "pexip",
                    TelephoneConferenceId = "121212"
                }
            };
        }

        [Test]
        public void Should_return_true_MeetingRoom_is_valid()
        {  
            var result = conferenceDetailsResp.HasValidMeetingRoom();

            result.Should().BeTrue();
        }

        [Test]
        public void Should_return_false_MeetingRoom_is_null()
        {
            conferenceDetailsResp.MeetingRoom = null;

            var result = conferenceDetailsResp.HasValidMeetingRoom();

            result.Should().BeFalse();
        }

        [Test]
        public void Should_return_false_AdminUri_is_null_or_empty()
        {
            conferenceDetailsResp.MeetingRoom.AdminUri = string.Empty;

            var result = conferenceDetailsResp.HasValidMeetingRoom();

            result.Should().BeFalse();
        }

        [Test]
        public void Should_return_false_JudgeUri_is_null_or_empty()
        {
            conferenceDetailsResp.MeetingRoom.JudgeUri = string.Empty;

            var result = conferenceDetailsResp.HasValidMeetingRoom();

            result.Should().BeFalse();
        }

        [Test]
        public void Should_return_false_ParticipantUri_is_null_or_empty()
        {
            conferenceDetailsResp.MeetingRoom.ParticipantUri = string.Empty;

            var result = conferenceDetailsResp.HasValidMeetingRoom();

            result.Should().BeFalse();
        }

        [Test]
        public void Should_return_false_PexipNode_is_null_or_empty()
        {
            conferenceDetailsResp.MeetingRoom.PexipNode = string.Empty;

            var result = conferenceDetailsResp.HasValidMeetingRoom();

            result.Should().BeFalse();
        }

    }
}
