using System;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Mappers;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/justice-users")]
    public class JusticeUsersController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly ILogger<JusticeUsersController> _logger;

        public JusticeUsersController(IBookingsApiClient bookingsApiClient, ILogger<JusticeUsersController> logger)
        {
            _bookingsApiClient = bookingsApiClient;
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
        public async Task<ActionResult> AddNewJusticeUser([FromBody] AddNewJusticeUserRequest addJusticeUserRequest)
        {
            try
            {
                var apiRequest =
                    AddJusticeUserRequestMapper.MapToBookingsApiRequest(addJusticeUserRequest, User.Identity!.Name);
                var newUser = await _bookingsApiClient.AddJusticeUserAsync(apiRequest);
                return Created("", newUser);
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode is (int)HttpStatusCode.BadRequest)
                {
                    var typedException = e as BookingsApiException<ValidationProblemDetails>;
                    return ValidationProblem(typedException!.Result);
                }

                if (e.StatusCode is (int)HttpStatusCode.Conflict)
                {
                    var typedException = e as BookingsApiException<string>;
                    return Conflict(typedException!.Result);
                }

                _logger.LogError(e, "Unexpected error trying to add a new justice user");
                throw;
            }
        }

        [HttpPatch]
        [SwaggerOperation(OperationId = "EditJusticeUser")]
        [ProducesResponseType(typeof(JusticeUserResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), (int)HttpStatusCode.BadRequest)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult> EditJusticeUser([FromBody] EditJusticeUserRequest editJusticeUserRequest)
        {
            try
            {
                var editedUser = await _bookingsApiClient.EditJusticeUserAsync(editJusticeUserRequest);
                return Ok(editedUser);
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode is (int)HttpStatusCode.BadRequest)
                {
                    var typedException = e as BookingsApiException<ValidationProblemDetails>;
                    return ValidationProblem(typedException!.Result);
                }

                if (e.StatusCode is (int)HttpStatusCode.NotFound)
                {
                    var typedException = e as BookingsApiException<string>;
                    return NotFound(typedException!.Result);
                }

                _logger.LogError(e, "Unexpected error trying to edit a justice user");
                throw;
            }
        }


        /// <summary>
        /// Delete a justice user
        /// </summary>
        /// <param name="id">The justice user id</param>
        /// <returns></returns>
        [HttpDelete("{id}")]
        [SwaggerOperation(OperationId = "DeleteJusticeUser")]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.NotFound)]
        [ProducesResponseType(typeof(ValidationProblemDetails), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> DeleteJusticeUser(Guid id)
        {
            try
            {
                await _bookingsApiClient.DeleteJusticeUserAsync(id);

                return NoContent();
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode is (int)HttpStatusCode.NotFound)
                {
                    var typedException = e as BookingsApiException<string>;
                    return NotFound(typedException!.Result);
                }

                if (e.StatusCode is (int)HttpStatusCode.BadRequest)
                {
                    var typedException = e as BookingsApiException<ValidationProblemDetails>;
                    return ValidationProblem(typedException!.Result);
                }

                _logger.LogError(e, "Unexpected error trying to delete justice user");
                throw;
            }
        }
        
        [HttpPatch("restore")]
        [SwaggerOperation(OperationId = "RestoreJusticeUser")]
        [ProducesResponseType(typeof(JusticeUserResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), (int)HttpStatusCode.BadRequest)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult> RestoreJusticeUser([FromBody] RestoreJusticeUserRequest restoreJusticeUserRequest)
        {
            try
            {
                await _bookingsApiClient.RestoreJusticeUserAsync(restoreJusticeUserRequest);
                return NoContent();
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode is (int)HttpStatusCode.BadRequest)
                {
                    var typedException = e as BookingsApiException<ValidationProblemDetails>;
                    return ValidationProblem(typedException!.Result);
                }

                if (e.StatusCode is (int)HttpStatusCode.NotFound)
                {
                    var typedException = e as BookingsApiException<string>;
                    return NotFound(typedException!.Result);
                }

                _logger.LogError(e, "Unexpected error trying to restore a justice user");
                throw;
            }
        }

    }


}