﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

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

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public SuitabilityAnswersController(IBookingsApiClient bookingsApiClient, IUserIdentity userIdentity)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
        }

        /// <summary>
        /// Gets the all latest participants suitability answers for a VH officer.
        /// </summary>
        /// <param name="cursor">The unique sequential value of participant ID.</param>
        /// <param name="limit">The max number of participants with suitability answers to be returned.</param>
        /// <returns> The participants suitability answers list</returns>
        [HttpGet]
        [SwaggerOperation(OperationId = "GetBookingsList")]
        [ProducesResponseType(typeof(BookingsResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public ActionResult GetSuitabilityAnswersList(string cursor, int limit = 100)
        {

            if (!_userIdentity.IsVhOfficerAdministratorRole())
            {
                return Unauthorized();
            }

            try
            {
                var answerResponse = _bookingsApiClient.GetSuitabilityAnswers(cursor, limit);
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
