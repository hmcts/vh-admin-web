﻿using BookingsApi.Client;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Contract.V1.Responses;

namespace AdminWebsite.Controllers
{
    /// <summary>
    /// Responsible for retrieving and storing person information
    /// </summary>
    [Produces("application/json")]
    [Route("api/staffmember")]
    [ApiController]
    public class StaffMemberController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public StaffMemberController(IBookingsApiClient bookingsApiClient)
        {
            _bookingsApiClient = bookingsApiClient;
        }

        /// <summary>
        /// Find staff member list by email search term.
        /// </summary>
        /// <param name = "term" > The email address search term.</param>
        /// <returns> The list of person</returns>
        [HttpGet]
        [SwaggerOperation(OperationId = "GetStaffMembersBySearchTerm")]
        [ProducesResponseType(typeof(List<PersonResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<IList<PersonResponse>>> GetStaffMembersBySearchTerm([FromQuery]string term)
        {
            if(term.Length < 3)
            {
                return BadRequest("Search term must be at least 3 characters.");
            }

            try
            {
                var personsResponse = await _bookingsApiClient.GetStaffMemberBySearchTermAsync(term);
                
                return Ok(personsResponse.ToList());
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }else if(e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    return Ok(new List<PersonResponse>());
                }

                throw;
            }
        }
    }
}
