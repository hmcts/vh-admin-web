using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using AdminWebsite.Mappers;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;

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

        public JudiciaryAccountsController(IUserAccountService userAccountService, JavaScriptEncoder encoder, IBookingsApiClient bookingsApiClient)
        {
            _userAccountService = userAccountService;
            _encoder = encoder;
            _bookingsApiClient = bookingsApiClient;
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
                var searchTerm = new SearchTermRequest(term);
                List<JudgeResponse> allJudges;
                var courtRoomJudgesTask = _userAccountService.SearchJudgesByEmail(searchTerm.Term);
                var courtRoomJudges = await courtRoomJudgesTask;
                allJudges = courtRoomJudges
                    .OrderBy(x => x.Email)
                    .Take(20)
                    .ToList();
                
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
        [HttpPost("search",Name = "SearchForJudiciaryPerson")]
        [SwaggerOperation(OperationId = "SearchForJudiciaryPerson")]
        [ProducesResponseType(typeof(List<JudiciaryPerson>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<List<JudiciaryPerson>>> SearchForJudiciaryPersonAsync([FromBody] string term)
        {
            // This is the v2 search for judicial office holders
            try
            {
                term = _encoder.Encode(term);
                var searchTerm = new SearchTermRequest(term);
                
                var eJudiciaryJudges = (await _bookingsApiClient.PostJudiciaryPersonBySearchTermAsync(searchTerm)).ToList();
                var allJudges = eJudiciaryJudges.OrderBy(x => x.Email).ToList();
                var mapped = allJudges.Select(x => x.MapToAdminWebResponse()).ToList();
                return Ok(mapped);
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
