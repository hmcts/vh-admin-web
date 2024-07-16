using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AdminWebsite.UnitTests.Controllers;

public class HealthControllerTests
{

    private Mock<HttpClient> _mockHttpClient;
    private Mock<IOptions<ServiceConfiguration>> _mockServiceConfiguration;
    
    [SetUp]
    public void Setup()
    {
        _mockHttpClient = new Mock<HttpClient>();
        _mockServiceConfiguration = new Mock<IOptions<ServiceConfiguration>>();
        
        _mockHttpClient.Setup(x => x.GetAsync(It.IsAny<string>())).ReturnsAsync(new HttpResponseMessage());
        _mockServiceConfiguration.Setup(x => x.Value).Returns(new ServiceConfiguration
        {
            BookingsApiUrl = "http://localhost:5000/"
        });
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
        
        _mockHttpClient.Setup(x => x.GetAsync(It.IsAny<string>())).ReturnsAsync(response);
        
        var controller = new HealthController(_mockHttpClient.Object, _mockServiceConfiguration.Object);
        
        // Act
        var result = await controller.GetBookingQueueState();
        
        // Assert
        var okResult = (OkObjectResult)result;
        okResult.StatusCode.Should().Be(200);
        okResult.Value.Should().BeEquivalentTo(new AppHealthStatusResponse { Name = "Booking Service Bus Queue", State = "Degraded" });
    }
}