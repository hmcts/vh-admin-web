using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
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
        private readonly IHearingApiClient _hearingApiClient;
        private readonly IUserIdentity _userIdentity;

        public ReferenceDataController(IHearingApiClient hearingApiClient, IUserIdentity userIdentity)
        {
            _hearingApiClient = hearingApiClient;
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
            var hearingTypes = await _hearingApiClient.GetHearingTypesAsync();
            var response = hearingTypes.Where(x => userGroups.Contains(x.Group));
            return Ok(response);
        }

        /// <summary>
        ///     Gets a list of hearing mediums
        /// </summary>
        /// <returns>List of hearing mediums available for a hearing</returns>
        [HttpGet("mediums", Name = "GetHearingMediums")]
        [ProducesResponseType(typeof (IList<HearingMediumResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<HearingMediumResponse>>> GetMediums()
        {
            var response = await _hearingApiClient.GetHearingsMediumsAsync();
            return Ok(response);
        }

        /// <summary>
        ///     Get available participant roles
        /// </summary>
        /// <returns>List of valid participant roles</returns>
        [HttpGet("participantroles", Name = "GetParticipantRoles")]
        [ProducesResponseType(typeof(IList<ParticipantRoleResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<ParticipantRoleResponse>>> GetParticipantRoles()
        {
            var response = await _hearingApiClient.GetParticipantRolesAsync();
            return Ok(response);
        }

        /// <summary>
        ///     Get available courts
        /// </summary>
        /// <returns>List of courts</returns>
        [HttpGet("courts", Name = "GetCourts")]
        [ProducesResponseType(typeof(IList<CourtResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<CourtResponse>>> GetCourts()
        {
            var response = await _hearingApiClient.GetCourtsAsync();
            return Ok(response);
        }
    }
}