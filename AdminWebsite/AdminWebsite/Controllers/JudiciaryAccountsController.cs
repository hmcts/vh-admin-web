using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/judiciary")]
    [ApiController]
    public class JudiciaryAccountsController : ControllerBase
    {
        private readonly IUserAccountService _userAccountService;
        private readonly JavaScriptEncoder _encoder;
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly TestUserSecrets _testSettings;

        public JudiciaryAccountsController(IUserAccountService userAccountService, JavaScriptEncoder encoder,
            IBookingsApiClient bookingsApiClient, IOptions<TestUserSecrets> testSettings) 
        {           
            _userAccountService = userAccountService;
            _encoder = encoder;
            _bookingsApiClient = bookingsApiClient;
            _testSettings = testSettings.Value;
        }

        /// <summary>
        /// Find judges and court rooms accounts list by email search term.
        /// </summary>
        /// <param name = "term" > The email address search term.</param>
        /// <returns> The list of judges</returns>
        [HttpPost("judges", Name = "PostJudgesBySearchTerm")]
        [SwaggerOperation(OperationId = "PostJudgesBySearchTerm")]
        [ProducesResponseType(typeof(List<JudgeResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<IList<JudgeResponse>>> PostJudgesBySearchTermAsync([FromBody] string term)
        {
            try
            {
                term = _encoder.Encode(term);
                var searchTerm = new SearchTermRequest
                {
                    Term = term
                };

                var personsResponse =  _bookingsApiClient.PostJudiciaryPersonBySearchTermAsync(searchTerm);
                var courtRoomsResponse =  _userAccountService.GetJudgeUsers();

                await Task.WhenAll(personsResponse, courtRoomsResponse);

                var persons = await personsResponse;
                var courtRooms = await courtRoomsResponse;

                var rooms = courtRooms.Where(x => x.Email.ToLower().Contains(searchTerm.Term.ToLower()));
                var judges = persons.Select(x => JudgeResponseMapper.MapTo(x));

                var allJudges = (rooms ?? Enumerable.Empty<JudgeResponse>()).Concat(judges ?? Enumerable.Empty<JudgeResponse>())
                    .OrderBy(x => x.Email).Take(20).ToList();

                return Ok(allJudges);
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
        /// Find judiciary person list by email search term.
        /// </summary>
        /// <param name = "term" > The email address search term.</param>
        /// <returns> The list of judiciary person</returns>
        [HttpPost(Name = "PostJudiciaryPersonBySearchTerm")]
        [SwaggerOperation(OperationId = "PostJudiciaryPersonBySearchTerm")]
        [ProducesResponseType(typeof(List<PersonResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<IList<PersonResponse>>> PostJudiciaryPersonBySearchTermAsync([FromBody] string term)
        {
            try
            {
                term = _encoder.Encode(term);
                var searchTerm = new SearchTermRequest
                {
                    Term = term
                };

                var personsResponse = await _bookingsApiClient.PostJudiciaryPersonBySearchTermAsync(searchTerm);
                personsResponse = personsResponse?.Where(p => !p.Username.Contains(_testSettings.TestUsernameStem)).ToList();

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
    }
}
