using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.UserAPI.Client;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Net;
using System.Threading.Tasks;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("HealthCheck")]
    [AllowAnonymous]
    [ApiController]
    public class HealthCheckController : Controller
    {
        private readonly IUserApiClient _userApiClient;
        private readonly IBookingsApiClient _bookingsApiClient;

        public HealthCheckController(IUserApiClient userApiClient, IBookingsApiClient bookingsApiClient)
        {
            _userApiClient = userApiClient;
            _bookingsApiClient = bookingsApiClient;
        }

        /// <summary>
        /// Check Service Health
        /// </summary>
        /// <returns>Error if fails, otherwise OK status</returns>
        [HttpGet("health")]
        [SwaggerOperation(OperationId = "CheckServiceHealth")]
        [ProducesResponseType(typeof(HealthCheckResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(HealthCheckResponse), (int)HttpStatusCode.InternalServerError)]
        public async Task<IActionResult> Health()
        {
            var response = new HealthCheckResponse
            {
                BookingsApiHealth = { Successful = true },
                UserApiHealth = { Successful = true }
            };
            try
            {
                await _userApiClient.GetJudgesAsync();
            }
            catch (Exception ex)
            {
                if (!(ex is UserServiceException))
                {
                    response.UserApiHealth.Successful = false;
                    response.UserApiHealth.ErrorMessage = ex.Message;
                    response.UserApiHealth.Data = ex.Data;
                }
            }

            try
            {
                await _bookingsApiClient.GetCaseTypesAsync();
            }
            catch (Exception ex)
            {
                if (!(ex is BookingsApiException))
                {
                    response.BookingsApiHealth.Successful = false;
                    response.BookingsApiHealth.ErrorMessage = ex.Message;
                    response.BookingsApiHealth.Data = ex.Data;
                }
            }

            if (!response.UserApiHealth.Successful || !response.BookingsApiHealth.Successful)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, response);
            }

            return Ok(response);
        }
    }
}