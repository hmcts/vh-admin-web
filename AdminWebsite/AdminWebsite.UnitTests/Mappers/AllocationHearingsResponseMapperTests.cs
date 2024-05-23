using AdminWebsite.Mappers;
using BookingsApi.Contract.V1.Responses;

namespace AdminWebsite.UnitTests.Mappers;

public class AllocationHearingsResponseMapperTests
{
    [Test]
    public void Should_map_all_properties_for_AllocationHearingsResponse()
    {
        var id = Guid.NewGuid();
        var hearingDate = DateTime.Now;
        var length = 400;
        var caseNumber = "0123-CaseNumber";
        var caseType = "caseType";
        var cso = "WilliamCraig";
        
        var source = new HearingAllocationsResponse()
        {
            HearingId = id,
            ScheduledDateTime = hearingDate,
            Duration = length,
            CaseNumber = caseNumber,
            CaseType = caseType,
            AllocatedCso = cso
        };

        var result = AllocationHearingsResponseMapper.Map(source);

        result.HearingId.Should().Be(id);
        result.ScheduledDateTime.Should().Be(hearingDate);
        result.Duration.Should().Be(length);
        result.CaseType.Should().Be(caseType);
        result.CaseNumber.Should().Be(caseNumber);
        result.AllocatedCso.Should().Be(cso);
    }
}