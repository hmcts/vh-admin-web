using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Extensions;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using UserApi.Client;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/justice-users")]
    public class JusticeUserController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly IUserApiClient _userApiClient;
        private readonly ILogger<JusticeUserController> _logger;

        public JusticeUserController(IBookingsApiClient bookingsApiClient, IUserApiClient userApiClient,
            ILogger<JusticeUserController> logger)
        {
            _bookingsApiClient = bookingsApiClient;
            _userApiClient = userApiClient;
            _logger = logger;
        }

        /// <summary>
        /// Add a new justice user
        /// </summary>
        /// <returns>a new justice user</returns>
        [HttpPost]
        [SwaggerOperation(OperationId = "AddNewJusticeUser")]
        [ProducesResponseType(typeof(JusticeUserResponse), (int)HttpStatusCode.Created)]
        [ProducesResponseType(typeof(ValidationProblemDetails), (int)HttpStatusCode.BadRequest)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.Conflict)]
        public async Task<ActionResult> AddNewJusticeUser([FromBody] AddJusticeUserRequest addJusticeUserRequest)
        {
            try
            {
                addJusticeUserRequest.CreatedBy = User.Identity.Name;
                var newUser = await _bookingsApiClient.AddAJusticeUserAsync(addJusticeUserRequest);
                return Created("", newUser);
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode is (int)HttpStatusCode.BadRequest)
                {
                    var typedException = e as BookingsApiException<ValidationProblemDetails>;
                    return ValidationProblem(typedException.Result);
                }

                if (e.StatusCode is (int)HttpStatusCode.Conflict)
                {
                    var typedException = e as BookingsApiException<string>;
                    return Conflict(typedException.Result);
                }

                _logger.LogError(e, "Unexpected error trying to add a new justice user");
                throw;
            }
        }

        /// <summary>
        /// Check AD for an account for a given justice user
        /// </summary>
        /// <param name="username"></param>
        /// <returns></returns>
        [HttpGet("/check/{username}")]
        [SwaggerOperation(OperationId = "CheckJusticeUserExists")]
        [ProducesResponseType(typeof(ExistingJusticeUserResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<ExistingJusticeUserResponse>> CheckJusticeUserExists([FromRoute] string username)
        {
            try
            {
                var existingUser = await _userApiClient.GetUserByAdUserNameAsync(username);
                var response = new ExistingJusticeUserResponse
                {
                    Username = existingUser.UserName,
                    FirstName = existingUser.FirstName,
                    LastName = existingUser.LastName,
                    Telephone = existingUser.TelephoneNumber,
                    ContactEmail = existingUser.Email
                };
                return Ok(response);
            }
            catch (UserApiException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    return NotFound($"Username could not be found. Please check the username and try again. An account may need to be requested via Service Catalogue.");
                }

                _logger.LogError(e, "Unexpected error when checking if a user with the username {Username} exists",
                    username);
                throw;
            }
        }
    }
}