using System;
using System.Collections.Generic;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Contract.Enums;
using BookingsApi.Contract.Requests;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers
{
    public class HearingUpdateRequestMapperTest
    {
        private EditHearingRequest _newParticipantRequest;
        private string _username = "username";
        private DateTime _scheduledDateTime = new DateTime(2020, 12, 12);
        private CaseRequest _caseRequest = new CaseRequest {Name = "casename", Number = "casenumber"};

        [SetUp]
        public void Setup()
        {
            _newParticipantRequest = new EditHearingRequest
            {
                HearingRoomName = "roomname",
                HearingVenueName = "venuename",
                OtherInformation = "other information",
                ScheduledDateTime = _scheduledDateTime,
                ScheduledDuration = 45,
                Case = new EditCaseRequest {Name = _caseRequest.Name, Number = _caseRequest.Number},
                QuestionnaireNotRequired = false,
                AudioRecordingRequired = false
            };
        }

        [Test]
        public void Should_map_properties_for_update_hearing_request()
        {
            var result = HearingUpdateRequestMapper.MapTo(_newParticipantRequest, _username);

            result.HearingRoomName.Should().Be(_newParticipantRequest.HearingRoomName);
            result.HearingVenueName.Should().Be(_newParticipantRequest.HearingVenueName);
            result.ScheduledDateTime.Should().Be(_scheduledDateTime);
            result.ScheduledDuration.Should().Be(_newParticipantRequest.ScheduledDuration);
            result.OtherInformation.Should().Be(_newParticipantRequest.OtherInformation);
            result.Cases.Should().BeEquivalentTo(_caseRequest);
            result.QuestionnaireNotRequired.Should().Be(_newParticipantRequest.QuestionnaireNotRequired);
            result.AudioRecordingRequired.Should().Be(_newParticipantRequest.AudioRecordingRequired);
        }

        [Test]
        public void Should_map_property_AudioRecordingRequired_with_true_value_for_when_linkedParticipant_is_interpreter()
        {
            _newParticipantRequest.Participants = new List<EditParticipantRequest>
            {
                new EditParticipantRequest
                {
                    LinkedParticipants = new List<LinkedParticipant>
                    {
                        new LinkedParticipant
                        {
                            Id = Guid.NewGuid(),
                            LinkedId = Guid.NewGuid(),
                            ParticipantId = Guid.NewGuid(),
                            Type = LinkedParticipantType.Interpreter
                        }
                    }
                }
            };
            var result = HearingUpdateRequestMapper.MapTo(_newParticipantRequest, _username);
            result.AudioRecordingRequired.Should().BeTrue();
        }
    }
}
