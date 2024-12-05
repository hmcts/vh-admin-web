using AdminWebsite.Mappers;
using AdminWebsite.UnitTests.Helper;
using BookingsApi.Contract.V2.Enums;
using V2 = BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.UnitTests.Mappers
{
    public class EndpointResponseMapperTests
    {
        [Test]
        public void Should_map_v2()
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
            // Arrange
            var existingEndpoint = hearing.Endpoints[0];
            var existingParticipant = hearing.Participants[0];
            var endpoint = new V2.EndpointResponseV2
            {
                Id = Guid.NewGuid(),
                ExternalReferenceId = Guid.NewGuid().ToString(),
                DisplayName = "DisplayName",
                Sip = "Sip",
                Pin = "Pin",
                DefenceAdvocateId = Guid.NewGuid(),
                InterpreterLanguage = new V2.InterpreterLanguagesResponse
                {
                    Code = "spa",
                    Value = "Spanish",
                    Type = InterpreterType.Verbal,
                    WelshValue = "WelshValue",
                    Live = true
                },
                Screening = new V2.ScreeningResponseV2()
                {
                    Type = ScreeningType.All,
                    ProtectedFrom = [existingEndpoint.ExternalReferenceId, existingParticipant.ExternalReferenceId]
                },
            };

            // Act
            var result = endpoint.Map(hearing);

            // Assert
            result.Id.Should().Be(endpoint.Id);
            result.DisplayName.Should().Be(endpoint.DisplayName);
            result.Sip.Should().Be(endpoint.Sip);
            result.ExternalReferenceId.Should().Be(endpoint.ExternalReferenceId);
            result.MeasuresExternalId.Should().Be(endpoint.MeasuresExternalId);
            result.Pin.Should().Be(endpoint.Pin);
            result.DefenceAdvocateId.Should().Be(endpoint.DefenceAdvocateId);
            result.InterpreterLanguage.Should().NotBeNull();
            result.InterpreterLanguage.Should().BeEquivalentTo(endpoint.InterpreterLanguage.Map());
            result.ScreeningRequirement.Should().NotBeNull();
            result.ScreeningRequirement.Type.Should().Be(AdminWebsite.Contracts.Enums.ScreeningType.All);
            
            result.ScreeningRequirement.ProtectFrom.Should().BeEquivalentTo(existingEndpoint.ExternalReferenceId, existingParticipant.ExternalReferenceId);
        }
        
        [Test]
        public void Should_map_without_interpreter_language_v2()
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
            // Arrange
            var endpoint = new V2.EndpointResponseV2
            {
                Id = Guid.NewGuid(),
                InterpreterLanguage = null
            };

            // Act
            var result = endpoint.Map(hearing);

            // Assert
            result.InterpreterLanguage.Should().BeNull();
        }
    }
}
