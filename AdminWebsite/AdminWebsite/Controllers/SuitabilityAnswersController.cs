using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace AdminWebsite.Controllers
{
    /// <summary>
    /// Responsible for retrieving all latest suitability answers of the participants.
    /// </summary>
    [Produces("application/json")]
    [Route("api/suitability-answers")]
    [ApiController]
    public class SuitabilityAnswersController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly IUserIdentity _userIdentity;
        private readonly JavaScriptEncoder _encoder;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public SuitabilityAnswersController(IBookingsApiClient bookingsApiClient, IUserIdentity userIdentity,
            JavaScriptEncoder encoder)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
            _encoder = encoder;
        }

        /// <summary>
        /// Gets the all latest participants suitability answers for a VH officer.
        /// </summary>
        /// <param name="cursor">The unique sequential value of participant ID.</param>
        /// <param name="limit">The max number of participants with suitability answers to be returned.</param>
        /// <returns> The participants suitability answers list</returns>
        [HttpGet]
        [SwaggerOperation(OperationId = "GetSuitabilityAnswers")]
        [ProducesResponseType(typeof(SuitabilityAnswersResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult> GetSuitabilityAnswersList(string cursor, int limit = 100)
        {
            if (cursor != null)
            {
                cursor = _encoder.Encode(cursor);
            }

            if (!_userIdentity.IsVhOfficerAdministratorRole())
            {
                return Unauthorized();
            }

            try
            {
                var answerResponse = await _bookingsApiClient.GetSuitabilityAnswersAsync(cursor, limit);
                return Ok(answerResponse);
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
