using AdminWebsite.Contracts.Responses;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Net;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/accounts")]
    public class UserDataController : ControllerBase
    {
        private readonly IUserAccountService _userAccountService;

        public UserDataController(IUserAccountService userAccountService)
        {
            _userAccountService = userAccountService;
        }

        /// <summary>
        ///     Get Judges
        /// </summary>
        [HttpGet("judges", Name = "GetJudges")]
        [ProducesResponseType(typeof(IList<ParticipantDetailsResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public ActionResult<IList<ParticipantDetailsResponse>> GetJudges()
        {
            var response = _userAccountService.GetUsersByGroup();
            return Ok(response);
        }
    }
}