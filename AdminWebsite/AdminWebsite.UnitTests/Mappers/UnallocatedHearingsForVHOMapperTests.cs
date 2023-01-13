using System;
using System.Collections.Generic;
using AdminWebsite.Mappers;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers;

public class UnallocatedHearingsForVhoMapperTests
{
    private readonly DateTime _testDate = new (2023, 01, 09);
    
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
                ScheduledDateTime = _testDate.AddDays(2) //within the week
            },
            new(){
                ScheduledDateTime = _testDate.AddDays(6) //within the week
            },
            new(){
                ScheduledDateTime = _testDate.AddDays(7) //within the month
            },
            new(){
                ScheduledDateTime = _testDate.AddDays(8) //within the month
            },
            new(){
                ScheduledDateTime = _testDate.AddDays(35) //outside the month
            }
        };

        var response = UnallocatedHearingsForVhoMapper.MapFrom(hearingDetailsResponse, _testDate);

        response.Today.Count.Should().Be(1);
        response.Tomorrow.Count.Should().Be(1);
        response.ThisWeek.Count.Should().Be(4);
        response.ThisMonth.Count.Should().Be(6);
    }
    
    [Test]
    public void Should_map_empty_HearingDetailsResponse_to_UnallocatedHearingsForVHOResponse()
    {
        var hearingDetailsResponse = new List<HearingDetailsResponse>();

        var response = UnallocatedHearingsForVhoMapper.MapFrom(hearingDetailsResponse, _testDate);

        response.Today.Should().Be(0);
        response.Tomorrow.Should().Be(0);
        response.ThisWeek.Should().Be(0);
        response.ThisMonth.Should().Be(0);
    }
}