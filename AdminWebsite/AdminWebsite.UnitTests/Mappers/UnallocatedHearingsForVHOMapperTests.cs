using AdminWebsite.Mappers;
using BookingsApi.Contract.V1.Responses;

namespace AdminWebsite.UnitTests.Mappers;

public class UnallocatedHearingsForVhoMapperTests
{
    private readonly DateTime _testDate = new (2023, 01, 09, 0, 0, 0, DateTimeKind.Utc);
    
    [Test]
    public void Should_map_HearingDetailsResponse_to_UnallocatedHearingsForVHOResponse()
    {
        var hearingDetailsResponse = new List<HearingDetailsResponse>
        {
            new(){
                ScheduledDateTime = _testDate //today
            },
            new(){
                ScheduledDateTime = _testDate.AddDays(1) //tomorrow
            },
            new(){
                ScheduledDateTime = _testDate.AddDays(1) //tomorrow
            },
            new(){
                ScheduledDateTime = _testDate.AddDays(2) //within the next 7 days
            },
            new(){
                ScheduledDateTime = _testDate.AddDays(7) //within the next 7 days
            },
            new(){
                ScheduledDateTime = _testDate.AddDays(8) //within the next 30 days
            },
            new(){
                ScheduledDateTime = _testDate.AddDays(9) //within the next 30 days
            },
            new(){
                ScheduledDateTime = _testDate.AddDays(35) //outside the next 30 days
            }
        };

        var response = UnallocatedHearingsForVhoMapper.MapFrom(hearingDetailsResponse, _testDate);

        response.Today.Count.Should().Be(1);
        response.Tomorrow.Count.Should().Be(2);
        response.Next7Days.Count.Should().Be(5);
        response.Next30Days.Count.Should().Be(7);
    }
    
    [Test]
    public void Should_map_empty_HearingDetailsResponse_to_UnallocatedHearingsForVHOResponse()
    {
        var hearingDetailsResponse = new List<HearingDetailsResponse>();

        var response = UnallocatedHearingsForVhoMapper.MapFrom(hearingDetailsResponse, _testDate);

        response.Today.Count.Should().Be(0);
        response.Tomorrow.Count.Should().Be(0);
        response.Next7Days.Count.Should().Be(0);
        response.Next30Days.Count.Should().Be(0);
    }
}