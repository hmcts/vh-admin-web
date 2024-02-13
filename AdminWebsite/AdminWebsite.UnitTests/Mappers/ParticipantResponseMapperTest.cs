using System;
using System.Collections.Generic;
using AdminWebsite.Mappers;
using BookingsApi.Contract.V2.Responses;
using FluentAssertions;
using NUnit.Framework;
using LinkedParticipantResponse = BookingsApi.Contract.V1.Responses.LinkedParticipantResponse;

namespace AdminWebsite.UnitTests.Mappers
{
    public class ParticipantResponseMapperTest
    {
        [Test]
        public void Should_map_participant_response_V1()
        {
            var id = Guid.NewGuid();
            var participants = new List<BookingsApi.Contract.V1.Responses.ParticipantResponse>();
            var participant = new BookingsApi.Contract.V1.Responses.ParticipantResponse()
            {
                FirstName = "Sam",
                LastName = "Smith",
                ContactEmail = "judge@personal.com",
                HearingRoleName = "Judge",
                DisplayName = "Display Name",
                Id = id,
                CaseRoleName = "Case Role Name",
                UserRoleName = "Judge",
                Title = "Title",
                MiddleNames = "Middle Names",
                TelephoneNumber = "01223445532",
                Username = "UserName",
                Organisation = "Pluto",
                Representee = "Representee",
                LinkedParticipants = new List<LinkedParticipantResponse>()
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
                participantResponse.CaseRoleName.Should().Be(participant.CaseRoleName);
                participantResponse.HearingRoleName.Should().Be(participant.HearingRoleName);
                participantResponse.UserRoleName.Should().Be(participant.UserRoleName);
                participantResponse.Title.Should().Be(participant.Title);
                participantResponse.MiddleNames.Should().Be(participant.MiddleNames);
                participantResponse.TelephoneNumber.Should().Be(participant.TelephoneNumber);
                participantResponse.Username.Should().Be(participant.Username);
                participantResponse.Organisation.Should().Be(participant.Organisation);
                participantResponse.Representee.Should().Be(participant.Representee);
                participantResponse.LinkedParticipants.Should().AllBeEquivalentTo(participant.LinkedParticipants);
            }
        }
        
        [Test]
        public void Should_map_participant_response_V2()
        {
            var id = Guid.NewGuid();
            var participants = new List<BookingsApi.Contract.V2.Responses.ParticipantResponseV2>();
            var participant = new BookingsApi.Contract.V2.Responses.ParticipantResponseV2()
            {
                FirstName = "Sam",
                LastName = "Smith",
                ContactEmail = "judge@personal.com",
                HearingRoleName = "Judge",
                DisplayName = "Display Name",
                Id = id,
                HearingRoleCode = "123",
                UserRoleName = "Judge",
                Title = "Title",
                MiddleNames = "Middle Names",
                TelephoneNumber = "01223445532",
                Username = "UserName",
                Organisation = "Pluto",
                Representee = "Representee",
                LinkedParticipants = new List<LinkedParticipantResponseV2>()
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
                participantResponse.UserRoleName.Should().Be(participant.UserRoleName);
                participantResponse.Title.Should().Be(participant.Title);
                participantResponse.MiddleNames.Should().Be(participant.MiddleNames);
                participantResponse.TelephoneNumber.Should().Be(participant.TelephoneNumber);
                participantResponse.Username.Should().Be(participant.Username);
                participantResponse.Organisation.Should().Be(participant.Organisation);
                participantResponse.Representee.Should().Be(participant.Representee);
                participantResponse.LinkedParticipants.Should().AllBeEquivalentTo(participant.LinkedParticipants);
            }
        }
    }
}
