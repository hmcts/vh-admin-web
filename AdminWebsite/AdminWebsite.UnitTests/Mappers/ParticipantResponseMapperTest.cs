using System.Diagnostics;
using AdminWebsite.Mappers;
using AdminWebsite.UnitTests.Helper;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.UnitTests.Mappers
{
    public class ParticipantResponseMapperTest
    {
        [Test]
        public void Should_map_participant_response_V2()
        {
            var hearing = HearingResponseV2Builder.Build()
                .WithEndPoints(2)
                .WithParticipant("Representative", "username1@hmcts.net")
                .WithParticipant("Individual", "fname2.lname2@hmcts.net")
                .WithParticipant("Individual", "fname3.lname3@hmcts.net")
                .WithParticipant("Judicial Office Holder", "fname4.lname4@hmcts.net")
                .WithParticipant("Judge", "judge.fudge@hmcts.net")
                .WithEndPoints(2)
                .WithSupplier(BookingSupplier.Vodafone);
            
            var id = Guid.NewGuid();
            var participants = new List<ParticipantResponseV2>();
            var existingEndpoint = hearing.Endpoints[0];
            Debug.Assert(existingEndpoint.ExternalReferenceId != null, "existingEndpoint.ExternalReferenceId != null");
            var existingParticipant = hearing.Participants[0];
            Debug.Assert(existingParticipant.ExternalReferenceId != null, "existingParticipant.ExternalReferenceId != null");
            var participant = new ParticipantResponseV2
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
                InterpreterLanguage = new InterpreterLanguagesResponse
                {
                    Code = "spa",
                    Value = "Spanish",
                    Type = InterpreterType.Verbal,
                    WelshValue = "WelshValue",
                    Live = true
                },
                Screening = new ScreeningResponseV2
                {
                    Type = ScreeningType.All,
                    ProtectedFrom = [existingEndpoint.ExternalReferenceId, existingParticipant.ExternalReferenceId]
                },
                LinkedParticipants = new List<LinkedParticipantResponseV2>()
            };
            participants.Add(participant);

            var participantsResponse = participants.Map(hearing);

            foreach (var participantResponse in participantsResponse)
            {
                participantResponse.ExternalReferenceId.Should().Be(participant.ExternalReferenceId);
                participantResponse.MeasuresExternalId.Should().Be(participant.MeasuresExternalId);
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
                participantResponse.InterpreterLanguage.Should().NotBeNull();
                participantResponse.InterpreterLanguage.Should().BeEquivalentTo(participant.InterpreterLanguage.Map());
                participantResponse.ScreeningRequirement.Should().NotBeNull();
                participantResponse.ScreeningRequirement.Type.Should().Be(AdminWebsite.Contracts.Enums.ScreeningType.All);
                
                participantResponse.ScreeningRequirement.ProtectFrom.Should().BeEquivalentTo(existingEndpoint.ExternalReferenceId, existingParticipant.ExternalReferenceId);
            }
        }

        [Test]
        public void Should_map_participant_without_interpreter_language_V2()
        {
            // Arrange
            var id = Guid.NewGuid();
            var participants = new List<ParticipantResponseV2>
            {
                new()
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
                    InterpreterLanguage = null
                }
            };

            // Act
            var participantsResponse = participants.Map(null);

            // Assert
            participantsResponse[0].InterpreterLanguage.Should().BeNull();
        }
    }
}
