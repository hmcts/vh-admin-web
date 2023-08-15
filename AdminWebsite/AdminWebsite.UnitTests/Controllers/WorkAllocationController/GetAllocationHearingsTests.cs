using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Responses;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers.WorkAllocationController;

public class GetAllocationHearingsTests
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
        _mocker.Mock<IBookingsApiClient>().Setup(client => client.SearchForAllocationHearingsAsync(
               It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<Guid[]>(), It.IsAny<string[]>(), It.IsAny<string>(), It.IsAny<bool>()))
            .ReturnsAsync(new List<HearingAllocationsResponse>{new ()});
        // Act
        var response = await _controller.GetAllocationHearings(new SearchForAllocationHearingsRequest());
        
        // Assert
        var result = response as OkObjectResult;
        result?.StatusCode.Should().Be(StatusCodes.Status200OK);
        result?.Value.Should().NotBeNull().And.BeAssignableTo<List<AllocationHearingsResponse>>();
    }

    [Test]
    public async Task Should_get_allocation_hearings_and_return_empty_list()
    {
        // Arrange
        _mocker.Mock<IBookingsApiClient>().Setup(client => client.SearchForAllocationHearingsAsync(
                It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<Guid[]>(), It.IsAny<string[]>(), It.IsAny<string>(), It.IsAny<bool>()))
            .ReturnsAsync(new List<HearingAllocationsResponse>());   
        // Act
        var response = await _controller.GetAllocationHearings(new SearchForAllocationHearingsRequest());

        // Assert
        var result = response as OkObjectResult;
        result?.StatusCode.Should().Be(StatusCodes.Status200OK);
        result?.Value.Should().NotBeNull().And.BeAssignableTo<List<AllocationHearingsResponse>>();
    }
}
