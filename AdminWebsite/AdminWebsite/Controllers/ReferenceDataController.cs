using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using HearingTypeResponse = AdminWebsite.Contracts.Responses.HearingTypeResponse;

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
        private readonly IUserIdentity _identity;
        private readonly JavaScriptEncoder _encoder;

        /// <summary>
        /// Instantiate the controller
        /// </summary>
        public ReferenceDataController(IBookingsApiClient bookingsApiClient, IUserIdentity identity, JavaScriptEncoder encoder)
        {
            _bookingsApiClient = bookingsApiClient;
            _identity = identity;
            _encoder = encoder;
        }

        /// <summary>
        ///     Gets a list hearing types
        /// </summary>
        /// <returns>List of hearing types</returns>
        [HttpGet("types", Name = "GetHearingTypes")]
        [ProducesResponseType(typeof(IList<HearingTypeResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<HearingTypeResponse>>> GetHearingTypes()
        {
            var allowedTypes = _identity.GetAdministratorCaseTypes();
            var caseTypes = await _bookingsApiClient.GetCaseTypesAsync();
            caseTypes = caseTypes.Where(c => allowedTypes.Contains(c.Name)).ToList();
            return caseTypes.SelectMany(caseType => caseType.Hearing_types.Select(hearingType => new HearingTypeResponse
            {
                Group = caseType.Name,
                Code = string.Empty, // not used anymore
                Id = hearingType.Id,
                Name = hearingType.Name
            })).ToList();
        }

        /// <summary>
        ///     Get available participant roles
        /// </summary>
        /// <returns>List of valid participant roles</returns>
        [HttpGet("participantroles", Name = "GetParticipantRoles")]
        [ProducesResponseType(typeof(IList<CaseAndHearingRolesResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<CaseAndHearingRolesResponse>>> GetParticipantRoles(string caseTypeName)
        {
            var response = new List<CaseAndHearingRolesResponse>();

            var caseRoles = await _bookingsApiClient.GetCaseRolesForCaseTypeAsync(caseTypeName);
            if (caseRoles != null && caseRoles.Any())
            {
                foreach (var item in caseRoles)
                {
                    var caseRole = new CaseAndHearingRolesResponse { Name = item.Name };
                    var hearingRoles = await _bookingsApiClient.GetHearingRolesForCaseRoleAsync(caseTypeName, item.Name);

                    caseRole.HearingRoles = hearingRoles.ConvertAll(x => new HearingRole {Name = x.Name, UserRole = x.User_role});

                    response.Add(caseRole);
                }
            }

            return Ok(response);
        }

        /// <summary>
        ///     Get available courts
        /// </summary>
        /// <returns>List of courts</returns>
        [HttpGet("courts", Name = "GetCourts")]
        [ProducesResponseType(typeof(IList<HearingVenueResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<HearingVenueResponse>>> GetCourts()
        {
            var response = await _bookingsApiClient.GetHearingVenuesAsync();
            return Ok(response);
        }
    }
}