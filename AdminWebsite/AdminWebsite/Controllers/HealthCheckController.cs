using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.UserAPI.Client;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Net;
using System.Reflection;
using System.Threading.Tasks;
using AdminWebsite.VideoAPI.Client;
using HealthCheckResponse = AdminWebsite.Models.HealthCheckResponse;
using NotificationApi.Client;
using NotificationApi.Contract;

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
        private readonly IVideoApiClient _videoApiClient;
        private readonly INotificationApiClient _notificationApiClient;

        public HealthCheckController(IUserApiClient userApiClient, IBookingsApiClient bookingsApiClient, 
            IVideoApiClient videoApiClient, INotificationApiClient notificationApiClient)
        {
            _userApiClient = userApiClient;
            _bookingsApiClient = bookingsApiClient;
            _videoApiClient = videoApiClient;
            _notificationApiClient = notificationApiClient;
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
                UserApiHealth = { Successful = true },
                VideoApiHealth = { Successful = true },
                NotificationApiHealth = { Successful = true },
                AppVersion = GetApplicationVersion()
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
            
            try
            {
                await _videoApiClient.GetExpiredOpenConferencesAsync();
            }
            catch (Exception ex)
            {
                if (!(ex is VideoApiException))
                {
                    response.VideoApiHealth.Successful = false;
                    response.VideoApiHealth.ErrorMessage = ex.Message;
                    response.VideoApiHealth.Data = ex.Data;
                }
            }

            try
            {
                await _notificationApiClient.GetTemplateByNotificationTypeAsync(NotificationType.CreateIndividual);
            }
            catch (Exception ex)
            {
                if (!(ex is NotificationApiException))
                {
                    response.NotificationApiHealth.Successful = false;
                    response.NotificationApiHealth.ErrorMessage = ex.Message;
                    response.NotificationApiHealth.Data = ex.Data;
                }
            }

            if (!response.UserApiHealth.Successful || !response.BookingsApiHealth.Successful || !response.VideoApiHealth.Successful
                || !response.NotificationApiHealth.Successful)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError, response);
            }

            return Ok(response);
        }

        private Models.ApplicationVersion GetApplicationVersion()
        {
            var applicationVersion = new Models.ApplicationVersion()
            {
                FileVersion = GetExecutingAssemblyAttribute<AssemblyFileVersionAttribute>(a => a.Version),
                InformationVersion = GetExecutingAssemblyAttribute<AssemblyInformationalVersionAttribute>(a => a.InformationalVersion)
            };
            
            return applicationVersion;
        }

        private static string GetExecutingAssemblyAttribute<T>(Func<T, string> value) where T : Attribute
        {
            var attribute = (T)Attribute.GetCustomAttribute(Assembly.GetExecutingAssembly(), typeof(T));
            
            return value.Invoke(attribute);
        }
    }
}