using AdminWebsite.Contracts.Requests;
using AdminWebsite.Mappers;

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
                DefenceAdvocateContactEmail = "email@email.com",
                InterpreterLanguageCode = "spa"
            };

            // Act
            var result = request.MapToV2();

            // Assert
            result.DisplayName.Should().Be(request.DisplayName);
            result.DefenceAdvocateContactEmail.Should().Be(request.DefenceAdvocateContactEmail);
            result.InterpreterLanguageCode.Should().Be(request.InterpreterLanguageCode);
        }
    }
}
