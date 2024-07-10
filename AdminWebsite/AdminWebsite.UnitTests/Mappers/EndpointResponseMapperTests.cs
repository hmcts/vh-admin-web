using AdminWebsite.Mappers;
using BookingsApi.Contract.V1.Enums;
using V1 = BookingsApi.Contract.V1.Responses;
using V2 = BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.UnitTests.Mappers
{
    public class EndpointResponseMapperTests
    {
        [Test]
        public void Should_map_v2()
        {
            // Arrange
            var endpoint = new V2.EndpointResponseV2
            {
                Id = Guid.NewGuid(),
                DisplayName = "DisplayName",
                Sip = "Sip",
                Pin = "Pin",
                DefenceAdvocateId = Guid.NewGuid(),
                InterpreterLanguage = new V1.InterpreterLanguagesResponse
                {
                    Code = "spa",
                    Value = "Spanish",
                    Type = InterpreterType.Verbal,
                    WelshValue = "WelshValue",
                    Live = true
                }
            };

            // Act
            var result = endpoint.Map();

            // Assert
            result.Id.Should().Be(endpoint.Id);
            result.DisplayName.Should().Be(endpoint.DisplayName);
            result.Sip.Should().Be(endpoint.Sip);
            result.Pin.Should().Be(endpoint.Pin);
            result.DefenceAdvocateId.Should().Be(endpoint.DefenceAdvocateId);
            result.InterpreterLanguage.Should().NotBeNull();
            result.InterpreterLanguage.Should().BeEquivalentTo(endpoint.InterpreterLanguage.Map());
        }
        
        [Test]
        public void Should_map_without_interpreter_language_v2()
        {
            // Arrange
            var endpoint = new V2.EndpointResponseV2
            {
                Id = Guid.NewGuid(),
                InterpreterLanguage = null
            };

            // Act
            var result = endpoint.Map();

            // Assert
            result.InterpreterLanguage.Should().BeNull();
        }
    }
}
