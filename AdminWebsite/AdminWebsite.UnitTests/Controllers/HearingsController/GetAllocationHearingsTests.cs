using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BookingsApi.Client;
using AdminWebsite.Contracts.Responses;
using Autofac.Extras.Moq;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController;

public class GetAllocationHearingsTests
{
    private AutoMock _mocker;
    private AdminWebsite.Controllers.HearingsController _controller;

    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        _controller = _mocker.Create<AdminWebsite.Controllers.HearingsController>();
    }

    [Test]
    public async Task Should_get_allocation_hearings()
    {
        // Arrange
        _mocker.Mock<IBookingsApiClient>().Setup(client => client.SearchForAllocationHearingsAsync(
               It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<string[]>(), It.IsAny<string[]>(), It.IsAny<string>()))
            .ReturnsAsync(new List<HearingDetailsResponse>{new ()});
        // Act
        var response = await _controller.GetAllocationHearings(new SearchForAllocationHearingsRequest());
        
        // Assert
        var result = response as OkObjectResult;
        result.StatusCode.Should().Be(StatusCodes.Status200OK);
        result.Value.Should().NotBeNull().And.BeAssignableTo<List<AllocationHearingsResponse>>();
    }

    [Test]
    public async Task Should_get_allocation_hearings_and_return_empty_list()
    {
        // Arrange
        _mocker.Mock<IBookingsApiClient>().Setup(client => client.SearchForAllocationHearingsAsync(
                It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<string[]>(), It.IsAny<string[]>(), It.IsAny<string>()))
            .ReturnsAsync(new List<HearingDetailsResponse>());   
        // Act
        var response = await _controller.GetAllocationHearings(new SearchForAllocationHearingsRequest());

        // Assert
        var result = response as OkObjectResult;
        result.StatusCode.Should().Be(StatusCodes.Status200OK);
        result.Value.Should().NotBeNull().And.BeAssignableTo<List<AllocationHearingsResponse>>();
    }
}
