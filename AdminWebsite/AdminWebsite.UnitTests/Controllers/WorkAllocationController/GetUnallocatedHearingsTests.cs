using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using HearingDetailsResponse = BookingsApi.Contract.V1.Responses.HearingDetailsResponse;

namespace AdminWebsite.UnitTests.Controllers.WorkAllocationController;

public class GetUnallocatedHearingsTests
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
    public async Task Should_get_unallocated_hearings()
    {
        // Arrange
        _mocker.Mock<IBookingsApiClient>().Setup(client => client.GetUnallocatedHearingsAsync())
            .ReturnsAsync(new List<HearingDetailsResponse> {new ()});
        // Act
        var response = await _controller.GetUnallocatedHearings();
        
        // Assert
        var result = response as OkObjectResult;
        result.StatusCode.Should().Be(StatusCodes.Status200OK);
        result.Value.Should().NotBeNull()
                             .And.BeAssignableTo<UnallocatedHearingsForVhoResponse>();
    }

    [Test]
    public async Task Should_try_get_unallocated_hearings_and_return_empty_list()
    {
        // Arrange
        _mocker.Mock<IBookingsApiClient>().Setup(client => client.GetUnallocatedHearingsAsync())
            .ReturnsAsync(new List<HearingDetailsResponse>());
            
        // Act
        var response = await _controller.GetUnallocatedHearings();
        
        // Assert
        var result = response as OkObjectResult;
        result.StatusCode.Should().Be(StatusCodes.Status200OK);
        result.Value.Should().NotBeNull()
            .And.BeAssignableTo<UnallocatedHearingsForVhoResponse>();
    }
}
