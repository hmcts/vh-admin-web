using System;
using System.Collections.Generic;
using AdminWebsite.Mappers;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers;

public class AllocationHearingsResponseMapperTests
{
    [Test]
    public void Should_map_all_properties_for_AllocationHearingsResponse()
    {
        var id = Guid.NewGuid();
        var hearingDate = DateTime.Now;
        var startTime = hearingDate.TimeOfDay; 
        var length = 400;
        var caseNumber = "0123-CaseNumber";
        var caseType = "caseType";
        var cso = "WilliamCraig";
        
        var source = new HearingDetailsResponse()
        {
            Id = id,
            ScheduledDateTime = hearingDate,
            ScheduledDuration = length,
            Cases = new List<CaseResponse>{ new() {Number = caseNumber}},
            CaseTypeName = caseType,
            AllocatedTo = cso
        };

        var result = AllocationHearingsResponseMapper.Map(source);

        result.HearingId.Should().Be(id);
        result.HearingDate.Should().Be(hearingDate.Date);
        result.StartTime.Should().Be(startTime);
        result.Duration.Should().Be(length);
        result.CaseType.Should().Be(caseType);
        result.CaseNumber.Should().Be(caseNumber);
        result.AllocatedCso.Should().Be(cso);
    }
}