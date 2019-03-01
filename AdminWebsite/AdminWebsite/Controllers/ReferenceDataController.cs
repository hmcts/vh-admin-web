using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.Controllers
{
    /// <summary>
    /// Responsible for retrieving reference data when requesting a booking.
    /// </summary>
    [Produces("application/json")]
    [Route("api/reference")]
    [ApiController]
    public class ReferenceDataController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;

        /// <summary>
        /// Instantiate the controller
        /// </summary>
        public ReferenceDataController(IBookingsApiClient bookingsApiClient)
        {
            _bookingsApiClient = bookingsApiClient;
        }
        
        /// <summary>
        ///     Gets a list hearing types
        /// </summary>
        /// <returns>List of hearing types</returns>
        [HttpGet("types", Name = "GetHearingTypes")]
        [ProducesResponseType(typeof (IList<HearingTypeResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public ActionResult<IList<HearingTypeResponse>> GetHearingTypes()
        {
            var caseTypes = new List<HearingTypeResponse>
            {
                new HearingTypeResponse
                {
                    Code = "SAJ",
                    Group = "Civil Money Claims",
                    Id = 2,
                    Name = "Application to Set Judgment Aside"
                },
                new HearingTypeResponse
                {
                    Code = "FDAH", Group = "Financial Remedy", Id = 3, Name = "First Directions Appointment"
                }
            };

            return Ok(caseTypes);
        }

        /// <summary>
        ///     Get available participant roles
        /// </summary>
        /// <returns>List of valid participant roles</returns>
        [HttpGet("participantroles", Name = "GetParticipantRoles")]
        [ProducesResponseType(typeof(IList<CaseRoleResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public ActionResult<IList<CaseRoleResponse>> GetParticipantRoles()
        {
            var caseRoles = new List<CaseRoleResponse>
            {
                new CaseRoleResponse {Name = "Citizen"}, new CaseRoleResponse {Name = "Professional"}
            };
            return Ok(caseRoles);
        }

        /// <summary>
        ///     Get available courts
        /// </summary>
        /// <returns>List of courts</returns>
        [HttpGet("courts", Name = "GetCourts")]
        [ProducesResponseType(typeof(IList<HearingVenueResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<HearingVenueResponse>>> GetCourts()
        {
            var response = await _bookingsApiClient.GetHearingVenuesAsync();
            return Ok(response);
        }
    }
}