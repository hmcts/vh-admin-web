using System;
using AdminWebsite.Mappers;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers
{
    public class HearingsForAudioFileSearchMapperTest
    {
        [Test]
        public void Should_map_all_properties()
        {
            var source = new AudioRecordedHearingsBySearchResponse
            {
                CaseName = "CaseName",
                CaseNumber = "CaseNumber",
                CourtroomAccount = "CourtroomAccount",
                CourtroomAccountName = "CourtroomAccountName",
                HearingRoomName = "HearingRoomName",
                HearingVenueName = "HearingVenueName",
                Id = Guid.NewGuid(),
                ScheduledDateTime = DateTime.Now
            };

            var result = HearingsForAudioFileSearchMapper.MapFrom(source);

            result.Should().NotBeNull();
            result.CaseName.Should().Be(source.CaseName);
            result.CaseNumber.Should().Be(source.CaseNumber);
            result.CourtroomAccount.Should().Be(source.CourtroomAccount);
            result.CourtroomAccountName.Should().Be(source.CourtroomAccountName);
            result.HearingRoomName.Should().Be(source.HearingRoomName);
            result.HearingVenueName.Should().Be(source.HearingVenueName);
            result.Id.Should().Be(source.Id);
            result.ScheduledDateTime.Should().Be(source.ScheduledDateTime);
        }
    }
}