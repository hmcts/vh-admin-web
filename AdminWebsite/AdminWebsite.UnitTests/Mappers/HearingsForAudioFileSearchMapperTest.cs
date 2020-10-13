using System;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Mappers;
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
                Case_name = "Case_name",
                Case_number = "Case_number",
                Courtroom_account = "Courtroom_account",
                Courtroom_account_name = "Courtroom_account_name",
                Hearing_room_name = "Hearing_room_name",
                Hearing_venue_name = "Hearing_venue_name",
                Id = Guid.NewGuid(),
                Scheduled_date_time = DateTime.Now
            };

            var result = HearingsForAudioFileSearchMapper.MapFrom(source);

            result.Should().NotBeNull();
            result.CaseName.Should().Be(source.Case_name);
            result.CaseNumber.Should().Be(source.Case_number);
            result.CourtroomAccount.Should().Be(source.Courtroom_account);
            result.CourtroomAccountName.Should().Be(source.Courtroom_account_name);
            result.HearingRoomName.Should().Be(source.Hearing_room_name);
            result.HearingVenueName.Should().Be(source.Hearing_venue_name);
            result.Id.Should().Be(source.Id);
            result.ScheduledDateTime.Should().Be(source.Scheduled_date_time);
        }
    }
}