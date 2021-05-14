using System;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Contract.Requests;
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

            result.HearingRoomName.Should().Be(source.HearingRoomName);
            result.HearingVenueName.Should().Be(source.HearingVenueName);
            result.ScheduledDateTime.Should().Be(scheduledDateTime);
            result.ScheduledDuration.Should().Be(source.ScheduledDuration);
            result.OtherInformation.Should().Be(source.OtherInformation);
            result.Cases.Should().BeEquivalentTo(caseRequest);
            result.QuestionnaireNotRequired.Should().BeFalse();
            result.AudioRecordingRequired.Should().BeFalse();
        }
    }
}
