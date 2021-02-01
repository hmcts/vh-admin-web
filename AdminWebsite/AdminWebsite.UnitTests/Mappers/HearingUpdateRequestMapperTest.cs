using System;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers
{
    public class HearingUpdateRequestMapperTest
    {
        [Test]
        public void Should_map_properties_for_update_hearing_request()
        {
            var username = "username";
            var scheduledDateTime = new DateTime(2020, 12, 12);
            var caseRequest = new CaseRequest {Name = "casename", Number = "casenumber"};

            var source = new EditHearingRequest
            {
                HearingRoomName = "roomname",
                HearingVenueName = "venuename",
                OtherInformation = "other information",
                ScheduledDateTime = scheduledDateTime,
                ScheduledDuration = 45,
                Case = new EditCaseRequest {Name = caseRequest.Name, Number = caseRequest.Number},
                QuestionnaireNotRequired = false,
                AudioRecordingRequired = false
            };

            var result = HearingUpdateRequestMapper.MapTo(source, username);

            result.Hearing_room_name.Should().Be(source.HearingRoomName);
            result.Hearing_venue_name.Should().Be(source.HearingVenueName);
            result.Scheduled_date_time.Should().Be(scheduledDateTime);
            result.Scheduled_duration.Should().Be(source.ScheduledDuration);
            result.Other_information.Should().Be(source.OtherInformation);
            result.Cases.Should().BeEquivalentTo(caseRequest);
            result.Questionnaire_not_required.Should().BeFalse();
            result.Audio_recording_required.Should().BeFalse();
        }
    }
}
