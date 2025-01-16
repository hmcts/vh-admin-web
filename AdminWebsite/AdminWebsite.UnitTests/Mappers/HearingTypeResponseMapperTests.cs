using AdminWebsite.Mappers;
using BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.UnitTests.Mappers;

public class HearingTypeResponseMapperTests
{
    [Test]
    public void Should_map_v2()
    {
        // Arrange
        var type = new CaseTypeResponseV2
        {
            Id = 1,
            Name = "Name",
            ServiceId = "123",
            IsAudioRecordingAllowed = true
        };

        // Act
        var result = type.Map();

        // Assert
        result.Id.Should().Be(type.Id);
        result.Group.Should().Be(type.Name);
        result.ServiceId.Should().Be(type.ServiceId);
        result.IsAudioRecordingAllowed.Should().Be(type.IsAudioRecordingAllowed);
    }
}