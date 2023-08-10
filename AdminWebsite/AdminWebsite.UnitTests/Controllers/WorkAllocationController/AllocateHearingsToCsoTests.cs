using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers.WorkAllocationController;

public class AllocateHearingsToCsoTests
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
    public async Task Should_return_ok_object_result_if_empty_list_is_returned_on_update()
    {
        // Arrange
        var request = new UpdateHearingAllocationToCsoRequest()
        {
            CsoId = Guid.NewGuid(),
            Hearings = new List<Guid>() {Guid.NewGuid(), Guid.NewGuid()}
        };
        
        var mockResponse = new List<HearingAllocationsResponse>();
        
        _mocker.Mock<IBookingsApiClient>().Setup(client => client.AllocateHearingsToCsoAsync(request))
            .ReturnsAsync(mockResponse);

        // act
        var result = await _controller.AllocateHearingsToCso(request);
        
        // assert
        result.Should().BeOfType<OkObjectResult>();
        var okObjectResult = result as OkObjectResult;
        okObjectResult.Value.Should().NotBeNull()
            .And.BeAssignableTo<List<AllocationHearingsResponse>>();
        okObjectResult.Value.As<List<AllocationHearingsResponse>>().Should().BeEmpty();
    }
    
    [Test]
    public async Task Should_return_ok_object_result_with_updated_allocated_hearings_response()
    {
        // Arrange
        var request = new UpdateHearingAllocationToCsoRequest()
        {
            CsoId = Guid.NewGuid(),
            Hearings = new List<Guid>() {Guid.NewGuid(), Guid.NewGuid()}
        };
        
        var mockResponse = Builder<HearingAllocationsResponse>.CreateListOfSize(2)
            .All()
            .With(x => x.ScheduledDateTime, DateTime.Today.AddHours(10).AddMinutes(30))
            .With(x => x.Duration, 40)
            .With(x => x.CaseType, "Generic")
            .With(x => x.AllocatedCso = request.CsoId.ToString())
            .TheFirst(1).With(x => x.HearingId, request.Hearings[0])
            .TheNext(1).With(x => x.HearingId, request.Hearings[1])
            .Build();
        
        _mocker.Mock<IBookingsApiClient>().Setup(client => client.AllocateHearingsToCsoAsync(request))
            .ReturnsAsync(mockResponse);

        // act
        var result = await _controller.AllocateHearingsToCso(request);
        
        // assert
        result.Should().BeOfType<OkObjectResult>();
        var okObjectResult = result as OkObjectResult;
        okObjectResult.Value.Should().NotBeNull()
            .And.BeAssignableTo<List<AllocationHearingsResponse>>();

        var hearings = okObjectResult.Value.As<List<AllocationHearingsResponse>>();
        hearings[0].HearingId.Should().Be(mockResponse[0].HearingId);
        hearings[0].AllocatedCso.Should().Be(mockResponse[0].AllocatedCso);
        
        hearings[1].HearingId.Should().Be(mockResponse[1].HearingId);
        hearings[1].AllocatedCso.Should().Be(mockResponse[1].AllocatedCso);
    }

    [Test]
    public void should_return_bad_request_object_with_api_exception_message()
    {
        // Arrange
        var request = new UpdateHearingAllocationToCsoRequest()
        {
            CsoId = Guid.NewGuid(),
            Hearings = new List<Guid>() {Guid.NewGuid(), Guid.NewGuid()}
        };

        var mockException = new BookingsApiException("error", 404, $"Unable to find cso with id {request.CsoId}", new Dictionary<string, IEnumerable<string>>(),
            new Exception());
        
        _mocker.Mock<IBookingsApiClient>().Setup(client => client.AllocateHearingsToCsoAsync(request))
            .ThrowsAsync(mockException);

        Assert.ThrowsAsync<BookingsApiException>(async () => await _controller.AllocateHearingsToCso(request));
    }
}