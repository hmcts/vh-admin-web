using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers.WorkAllocationController;

public class GetAllocatedCsoForHearingTests
{
    private AutoMock _mocker;
    private AdminWebsite.Controllers.WorkAllocationController _controller;

    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        _controller = _mocker.Create<AdminWebsite.Controllers.WorkAllocationController>();
    }

    [Test]
    public async Task Should_get_allocation_hearings()
    {
        // Arrange
        var hearingId = Guid.NewGuid();
        _mocker.Mock<IBookingsApiClient>()
            .Setup(client => client.GetAllocationsForHearingsAsync(It.IsAny<IEnumerable<Guid>>()))
            .ReturnsAsync(new List<AllocatedCsoResponse> { new AllocatedCsoResponse() { HearingId = hearingId } });
        // Act
        var response = await _controller.GetAllocatedCsoForHearing(hearingId);
        
        // Assert
        var result = response as OkObjectResult;
        result?.StatusCode.Should().Be(StatusCodes.Status200OK);
        var allocatedCsoResponse = result?.Value as AllocatedCsoResponse;
        allocatedCsoResponse.Should().NotBeNull().And.BeAssignableTo<AllocatedCsoResponse>();
        allocatedCsoResponse.HearingId.Should().Be(hearingId);
    }

    [Test]
    public async Task Should_get_allocation_hearings_and_return_empty_list()
    {
        // Arrange
        _mocker.Mock<IBookingsApiClient>()
            .Setup(client => client.GetAllocationsForHearingsAsync(It.IsAny<IEnumerable<Guid>>()))
            .ReturnsAsync(() => null);
        
        // Act
        var response = await _controller.GetAllocatedCsoForHearing(Guid.NewGuid());
        
        // Assert
        var result = response as BadRequestResult;
        result?.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }
}
