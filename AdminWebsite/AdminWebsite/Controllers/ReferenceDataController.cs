using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Security;
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
        private readonly IUserIdentity _userIdentity;

        public ReferenceDataController(IBookingsApiClient bookingsApiClient, IUserIdentity userIdentity)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
        }
        
        /// <summary>
        ///     Gets a list hearing types
        /// </summary>
        /// <returns>List of hearing types</returns>
        [HttpGet("types", Name = "GetHearingTypes")]
        [ProducesResponseType(typeof (IList<HearingTypeResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<HearingTypeResponse>>> GetHearingTypes()
        {
            var userGroups = _userIdentity.GetGroupDisplayNames();
            // var hearingTypes = await _bookingsApiClient.GetHearingRolesForCaseRoleAsync();
            var caseTypes = new List<HearingTypeResponse>();
            caseTypes.Add(new HearingTypeResponse
            {
                Code = "BTA",
                Group = "Tax",
                Id = 1,
                Name = "Basic Tax Appeals"
            });
            caseTypes.Add(new HearingTypeResponse
            {
                Code = "SAJ",
                Group = "Civil Money Claims",
                Id = 2,
                Name = "Application to Set Judgment Aside"
            });
            caseTypes.Add(new HearingTypeResponse
            {
                Code = "FDAH",
                Group = "Financial Remedy",
                Id = 3,
                Name = "First Directions Appointment"
            });
            // var response = hearingTypes.Where(x => userGroups.Contains(x.Name));
            return Ok(caseTypes);
        }

        /// <summary>
        ///     Get available participant roles
        /// </summary>
        /// <returns>List of valid participant roles</returns>
        [HttpGet("participantroles", Name = "GetParticipantRoles")]
        [ProducesResponseType(typeof(IList<CaseRoleResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<CaseRoleResponse>>> GetParticipantRoles(string caseTypeName)
        {
            var response = await _bookingsApiClient.GetCaseRolesForCaseTypeAsync(caseTypeName);
            return Ok(response);
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