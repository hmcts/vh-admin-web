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
        [ProducesResponseType(typeof(IList<JudgeResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public ActionResult<IList<JudgeResponse>> GetJudges()
        {
            var response = _userAccountService.GetJudgeUsers();
            return Ok(response);
        }
    }
}