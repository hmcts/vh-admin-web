using AdminWebsite.Contracts.Requests;
using AdminWebsite.Mappers;
using BookingsApi.Contract.V2.Enums;

namespace AdminWebsite.UnitTests.Mappers;

public class SpecialMeasureScreeningRequestMapperTests
{
    [Test]
    public void should_handle_null()
    {
        var req = new ParticipantRequest
        {
            ScreeningRequirements = null
        };
        req.ScreeningRequirements.MapToV2().Should().BeNull();
    }

    [Test]
    public void should_map_screen_from_all()
    {
        var req = new SpecialMeasureScreeningRequest { ScreenAll = true };
    
        var result = req.MapToV2();
            
        result.Type.Should().Be(ScreeningType.All);
        result.ProtectedFrom.Should().BeEmpty();
    }

    [Test]
    public void should_map_screen_from_specific()
    {
        var req = new SpecialMeasureScreeningRequest()
        {
            ScreenAll = false,
            ScreenFromExternalReferenceIds = ["participant1@test.com", "endpoint1"]
        };

        var result = req.MapToV2();

        result.Type.Should().Be(ScreeningType.Specific);

        result.ProtectedFrom.Should().BeEquivalentTo("participant1@test.com", "endpoint1");
    }
}