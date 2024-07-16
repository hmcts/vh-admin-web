using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;

namespace AdminWebsite.Controllers;

[Produces("application/json")]
[Route("api/health")]
[ApiController]
public class HealthController(HttpClient httpClient, IOptions<ServiceConfiguration> serviceSettings) : ControllerBase
{
    private readonly ServiceConfiguration _serviceConfiguration = serviceSettings.Value;
    private const string BqsServiceName = "Booking Service Bus Queue";

    [HttpGet("bqs", Name = "GetBookingQueueState")]
    [SwaggerOperation(OperationId = "GetBookingQueueState")]
    [ProducesResponseType(typeof(AppHealthStatusResponse), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetBookingQueueState()
    {
        var response = await httpClient.GetAsync($"{_serviceConfiguration.BookingsApiUrl}health/readiness");
        var responseContent = await response.Content.ReadAsStringAsync();
        var deserializeResponse = Newtonsoft.Json.JsonConvert.DeserializeAnonymousType(responseContent, 
            new { status = "", details = new [] { new { key = "", value = "" } } });
        var bqsStatus = Array.Find(deserializeResponse.details, x => x.key == BqsServiceName)?.value;
        return Ok(new AppHealthStatusResponse { Name = BqsServiceName, State = bqsStatus});
    }
}