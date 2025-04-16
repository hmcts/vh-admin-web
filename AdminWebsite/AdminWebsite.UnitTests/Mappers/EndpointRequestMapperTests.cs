using AdminWebsite.Contracts.Requests;
using AdminWebsite.Mappers;
using BookingsApi.Contract.V2.Enums;

namespace AdminWebsite.UnitTests.Mappers
{
    public class EndpointRequestMapperTests
    {
        [Test]
        public void Should_map_to_V2()
        {
            // Arrange
            var request = new EndpointRequest
            {
                DisplayName = "DisplayName",
                LinkedParticipantEmails = ["email@email.com"],
                InterpreterLanguageCode = "spa",
                ScreeningRequirements = new SpecialMeasureScreeningRequest()
                {
                    ScreenAll = false,
                    ScreenFromExternalReferenceIds = ["abc", "def"]
                }
            };

            // Act
            var result = request.MapToV2();

            // Assert
            result.DisplayName.Should().Be(request.DisplayName);
            result.LinkedParticipantEmails.Should().Contain(request.LinkedParticipantEmails[0]);
            result.InterpreterLanguageCode.Should().Be(request.InterpreterLanguageCode);
            
            result.Screening.Type.Should().Be(ScreeningType.Specific);
            result.Screening.ProtectedFrom.Should()
                .BeEquivalentTo(request.ScreeningRequirements.ScreenFromExternalReferenceIds);
        }
    }
}
