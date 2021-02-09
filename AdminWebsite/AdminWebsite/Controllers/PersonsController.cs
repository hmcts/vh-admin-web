using System;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Services;
using UserApi.Client;

namespace AdminWebsite.Controllers
{
    /// <summary>
    /// Responsible for retrieving and storing person information
    /// </summary>
    [Produces("application/json")]
    [Route("api/persons")]
    [ApiController]
    public class PersonsController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly IUserAccountService _userAccountService;
        private readonly JavaScriptEncoder _encoder;
        private readonly TestUserSecrets _testSettings;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public PersonsController(IBookingsApiClient bookingsApiClient, JavaScriptEncoder encoder,
            IOptions<TestUserSecrets> testSettings, IUserAccountService userAccountService)
        {
            _bookingsApiClient = bookingsApiClient;
            _encoder = encoder;
            _userAccountService = userAccountService;
            _testSettings = testSettings.Value;
        }

        /// <summary>
        /// Find person list by email search term.
        /// </summary>
        /// <param name = "term" > The email address search term.</param>
        /// <returns> The list of person</returns>
        [HttpPost]
        [SwaggerOperation(OperationId = "PostPersonBySearchTerm")]
        [ProducesResponseType(typeof(List<PersonResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<IList<PersonResponse>>> PostPersonBySearchTerm([FromBody] string term)
        {
            try
            {
                term = _encoder.Encode(term);
                var searchTerm = new SearchTermRequest
                {
                    Term = term
                };

                var personsResponse = await _bookingsApiClient.PostPersonBySearchTermAsync(searchTerm);
                personsResponse = personsResponse?.Where(p => !p.Contact_email.Contains(_testSettings.TestUsernameStem)).ToList();

                return Ok(personsResponse);
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }

                throw;
            }
        }

        /// <summary>
        /// Get all hearings for a person by username
        /// </summary>
        /// <param name="username"></param>
        /// <returns></returns>
        [HttpGet("username/hearings", Name = "GetHearingsByUsernameForDeletion")]
        [SwaggerOperation(OperationId = "GetHearingsByUsernameForDeletion")]
        [ProducesResponseType(typeof(List<HearingsByUsernameForDeletionResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<List<HearingsByUsernameForDeletionResponse>>> GetHearingsByUsernameForDeletionAsync([FromQuery] string username)
        {
            var userId = await _userAccountService.GetAdUserIdForUsername(username);
            var userExists = !string.IsNullOrWhiteSpace(userId);

            try
            {

                var response = await _bookingsApiClient.GetHearingsByUsernameForDeletionAsync(username);
                return Ok(response);
            }
            catch (BookingsApiException e)
            {
                if (userExists && e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    return Ok(new List<HearingsByUsernameForDeletionResponse>());
                }

                if (!userExists && e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    return NotFound();
                }

                if (e.StatusCode == (int)HttpStatusCode.Unauthorized)
                {
                    return Unauthorized();
                }

                throw;
            }
        }

        /// <summary>
        /// Delete a user account and anonymise a person in bookings
        /// </summary>
        /// <param name="username">username of person</param>
        /// <returns></returns>
        [HttpDelete("username/{username}", Name = "DeletePersonWithUsername")]
        [SwaggerOperation(OperationId = "DeletePersonWithUsername")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> DeletePersonWithUsernameAsync(string username)
        {
            var usernameCleaned = username.ToLower().Trim();
            await _userAccountService.DeleteParticipantAccountAsync(usernameCleaned);
            return NoContent();
        }

        /// <summary>
        /// Search for non judge persons by contact email
        /// </summary>
        /// <param name="contactEmail"></param>
        /// <returns>A person</returns>
        [HttpGet(Name = "GetPersonForUpdateByContactEmail")]
        [SwaggerOperation(OperationId = "GetPersonForUpdateByContactEmail")]
        [ProducesResponseType(typeof(PersonResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<PersonResponse>> GetPersonForUpdateByContactEmail(
            [FromQuery] string contactEmail)
        {
            try
            {
                var person = await _bookingsApiClient.SearchForNonJudicialPersonsByContactEmailAsync(contactEmail);
                return Ok(person);
            }
            catch (BookingsApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        /// <returns>A person</returns>
        /// <summary>
        /// Update the personal details
        /// </summary>
        /// <param name="personId">The id of the person to update</param>
        /// <param name="payload">Updated details of the person</param>
        /// <returns></returns>
        [HttpPut("{personId}")]
        [SwaggerOperation(OperationId = "UpdatePersonDetails")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<IList<PersonResponse>>> UpdatePersonDetails([FromRoute] Guid personId,
            [FromBody] UpdateAccountDetailsRequest payload)
        {

            try
            {
                var useridString = await _userAccountService.GetAdUserIdForUsername(payload.CurrentUsername);
                var userId = Guid.Parse(useridString);
                var updatedPerson =
                    await _userAccountService.UpdateUserAccountDetails(userId, payload.FirstName, payload.LastName);

                var updateBookingPersonRequest = new UpdatePersonDetailsRequest
                {
                    First_name = updatedPerson.FirstName,
                    Last_name = updatedPerson.LastName,
                    Username = updatedPerson.Email
                };
                await _bookingsApiClient.UpdatePersonDetailsAsync(personId, updateBookingPersonRequest);
                return Accepted();
            }
            catch (UserApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
            catch (BookingsApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
