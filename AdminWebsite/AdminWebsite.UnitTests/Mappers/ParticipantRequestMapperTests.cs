using AdminWebsite.Contracts.Requests;
using AdminWebsite.Mappers;
using BookingsApi.Contract.V2.Enums;

namespace AdminWebsite.UnitTests.Mappers
{
    public class ParticipantRequestMapperTests
    {
        [Test]
        public void Should_map_to_v2()
        {
            // Arrange
            var request = new ParticipantRequest
            {
                ContactEmail = "email@email.com",
                DisplayName = "DisplayName",
                FirstName = "FirstName",
                HearingRoleCode = "Judge",
                LastName = "LastName",
                MiddleNames = "MiddleNames",
                Representee = "Representee",
                TelephoneNumber = "123",
                Title = "Title",
                OrganisationName = "OrganisationName",
                InterpreterLanguageCode = "spa",
                ScreeningRequirements = new SpecialMeasureScreeningRequest()
                {
                    ScreenAll = false,
                    ScreenFromParticipantContactEmails = ["participant1@test.com"],
                    ScreenFromJvsDisplayNames = ["endpoint1"]
                }
            };

            // Act
            var result = request.MapToV2();

            // Assert
            result.ContactEmail.Should().Be(request.ContactEmail);
            result.DisplayName.Should().Be(request.DisplayName);
            result.FirstName.Should().Be(request.FirstName);
            result.HearingRoleCode.Should().Be(request.HearingRoleCode);
            result.LastName.Should().Be(request.LastName);
            result.MiddleNames.Should().Be(request.MiddleNames);
            result.Representee.Should().Be(request.Representee);
            result.TelephoneNumber.Should().Be(request.TelephoneNumber);
            result.Title.Should().Be(request.Title);
            result.OrganisationName.Should().Be(request.OrganisationName);
            result.InterpreterLanguageCode.Should().Be(request.InterpreterLanguageCode);

            result.Screening.Type.Should().Be(ScreeningType.Specific);
            result.Screening.ProtectFromParticipants.Should()
                .BeEquivalentTo(request.ScreeningRequirements.ScreenFromParticipantContactEmails);
            result.Screening.ProtectFromEndpoints.Should()
                .BeEquivalentTo(request.ScreeningRequirements.ScreenFromJvsDisplayNames);
        }
    }
}
