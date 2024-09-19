using AdminWebsite.Mappers;
using AdminWebsite.UnitTests.Helper;
using BookingsApi.Contract.V1.Enums;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Responses;
using V1 = BookingsApi.Contract.V1.Responses;

namespace AdminWebsite.UnitTests.Mappers
{
    public class ParticipantResponseMapperTest
    {
        [Test]
        public void Should_map_participant_response_V1()
        {
            var id = Guid.NewGuid();
            var participants = new List<V1.ParticipantResponse>();
            var participant = new V1.ParticipantResponse
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
                LinkedParticipants = new List<V1.LinkedParticipantResponse>(),
            };
            participants.Add(participant);

            var participantsResponse = participants.Map();

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
                InterpreterLanguage = new V1.InterpreterLanguagesResponse
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
                    ProtectFromEndpointsIds = [hearing.Endpoints[0].Id],
                    ProtectFromParticipantsIds = [hearing.Participants[0].Id]
                },
                LinkedParticipants = new List<LinkedParticipantResponseV2>()
            };
            participants.Add(participant);

            var participantsResponse = participants.Map(hearing);

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
                participantResponse.InterpreterLanguage.Should().NotBeNull();
                participantResponse.InterpreterLanguage.Should().BeEquivalentTo(participant.InterpreterLanguage.Map());
                participantResponse.ScreeningRequirement.Should().NotBeNull();
                participantResponse.ScreeningRequirement.Type.Should().Be(AdminWebsite.Contracts.Enums.ScreeningType.All);
                participantResponse.ScreeningRequirement.ProtectFromEndpoints.Should().BeEquivalentTo(participant.Screening.ProtectFromEndpointsIds);
                participantResponse.ScreeningRequirement.ProtectFromParticipants.Should().BeEquivalentTo(participant.Screening.ProtectFromParticipantsIds);
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
