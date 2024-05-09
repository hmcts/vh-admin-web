﻿using AdminWebsite.Contracts.Responses;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using UserApi.Client;

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
        ///     Search Judges by email
        /// </summary>
        /// <param name="term"></param>
        /// <returns>A list of judges</returns>
        [HttpGet("judges/search/email", Name = "SearchJudgesByEmail")]
        [ProducesResponseType(typeof(IList<JudgeResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<JudgeResponse>>> SearchJudgesByEmail(string term)
        {
            var response = await _userAccountService.SearchJudgesByEmail(term);
            return Ok(response);
        }

        /// <summary>
        ///     Updates the users AAD password.
        /// </summary>
        /// <param name="userName"></param>
        /// <returns></returns>
        [HttpPatch("resetpassword")]
        [SwaggerOperation(OperationId = "ResetPassword")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult> ResetPassword([FromBody]string userName)
        {
            try
            {
                await _userAccountService.ResetParticipantPassword(userName);
                return Ok();
            }
            catch (UserApiException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }
                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    return NotFound(e.Response);
                }
                throw;
            }
        }
    }
}