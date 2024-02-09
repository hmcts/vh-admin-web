using System;
using System.Collections.Generic;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers;
using BookingsApi.Contract.V1.Responses;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers
{
    public class ParticipantResponseMapperTest
    {
        [Test]
        public void Should_map_person_response_to_participant_response_V1()
        {
            var id = Guid.NewGuid();
            List<BookingsApi.Contract.V1.Responses.ParticipantResponse> participants = new List<BookingsApi.Contract.V1.Responses.ParticipantResponse>();
            BookingsApi.Contract.V1.Responses.ParticipantResponse participant = new BookingsApi.Contract.V1.Responses.ParticipantResponse()
            {
                FirstName = "Sam",
                LastName = "Smith",
                ContactEmail = "judge@personal.com",
                HearingRoleName = "Judge",
                DisplayName = "Display Name",
                Id = id
            };
            participants.Add(participant);

            var participantsResponse = ParticipantResponseMapper.Map(participants);

            foreach (var participantResponse in participantsResponse)
            {
                participantResponse.FirstName.Should().Be(participant.FirstName);
                participantResponse.LastName.Should().Be(participant.LastName);
                participantResponse.ContactEmail.Should().Be(participant.ContactEmail);
                participantResponse.HearingRoleName.Should().Be(participant.HearingRoleName);
                participantResponse.DisplayName.Should().Be(participant.DisplayName);
                participantResponse.Id.Should().Be(participant.Id);
            }
        }
        
        [Test]
        public void Should_map_person_response_to_participant_response_V2()
        {
            var id = Guid.NewGuid();
            List<BookingsApi.Contract.V2.Responses.ParticipantResponseV2> participants = new List<BookingsApi.Contract.V2.Responses.ParticipantResponseV2>();
            BookingsApi.Contract.V2.Responses.ParticipantResponseV2 participant = new BookingsApi.Contract.V2.Responses.ParticipantResponseV2()
            {
                FirstName = "Sam",
                LastName = "Smith",
                ContactEmail = "judge@personal.com",
                HearingRoleName = "Judge",
                DisplayName = "Display Name",
                Id = id,
                HearingRoleCode = "123"
            };
            participants.Add(participant);

            var participantsResponse = ParticipantResponseMapper.Map(participants);

            foreach (var participantResponse in participantsResponse)
            {
                participantResponse.FirstName.Should().Be(participant.FirstName);
                participantResponse.LastName.Should().Be(participant.LastName);
                participantResponse.ContactEmail.Should().Be(participant.ContactEmail);
                participantResponse.HearingRoleName.Should().Be(participant.HearingRoleName);
                participantResponse.DisplayName.Should().Be(participant.DisplayName);
                participantResponse.Id.Should().Be(participant.Id);
                participantResponse.HearingRoleCode.Should().Be(participant.HearingRoleCode);
            }
        }
    }
}
