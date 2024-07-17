using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq.Protected;

namespace AdminWebsite.UnitTests.Controllers;

public class HealthControllerTests
{
    private Mock<IOptions<ServiceConfiguration>> _mockServiceConfiguration;
    private Mock<HttpMessageHandler> _mockMessageHandler;
    
    [SetUp]
    public void Setup()
    {
        _mockServiceConfiguration = new Mock<IOptions<ServiceConfiguration>>();
        _mockServiceConfiguration.Setup(x => x.Value).Returns(new ServiceConfiguration { BookingsApiUrl = "http://localhost:5000/" });
        _mockMessageHandler = new Mock<HttpMessageHandler>();
    }
    
    [Test]
    public async Task Should_return_booking_queue_state()
    {
        // Arrange
        var response = new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.OK,
            Content = new StringContent("{\"status\":\"Degraded\",\"details\":[{\"key\":\"Database VhBookings\",\"value\":\"Healthy\",\"error\":null},{\"key\":\"Booking Service Bus Queue\",\"value\":\"Degraded\",\"error\":\"status-code: 404.\"}]}")
        };
        
        _mockMessageHandler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(response);

       
        var controller = new HealthController(new HttpClient(_mockMessageHandler.Object), _mockServiceConfiguration.Object);
        
        // Act
        var result = await controller.GetBookingQueueState();
        
        // Assert
        var okResult = (OkObjectResult)result;
        okResult.StatusCode.Should().Be(200);
        okResult.Value.Should().BeEquivalentTo(new AppHealthStatusResponse { Name = "Booking Service Bus Queue", State = "Degraded" });
    }
}