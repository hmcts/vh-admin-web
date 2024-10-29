using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Models;
using BookingsApi.Client;
using BookingsApi.Contract.Interfaces.Response;
using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.Controllers.ReferenceData;

/// <summary>
/// Responsible for retrieving participant roles reference data when requesting a booking.
/// </summary>
public class ParticipantRolesController : ReferenceDataControllerBase
{
    private readonly IBookingsApiClient _bookingsApiClient;

    /// <summary>
    /// Instantiate the controller
    /// </summary>
    public ParticipantRolesController(IBookingsApiClient bookingsApiClient)
    {
        _bookingsApiClient = bookingsApiClient;
    }

    /// <summary>
    ///     Get available participant roles
    /// </summary>
    /// <returns>List of valid participant roles</returns>
    [HttpGet("participantroles", Name = "GetParticipantRoles")]
    [ProducesResponseType(typeof(IList<CaseAndHearingRolesResponse>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<ActionResult<IList<CaseAndHearingRolesResponse>>> GetParticipantRoles(string caseTypeParameter)
    {
        var response = new List<CaseAndHearingRolesResponse>();
        List<ICaseRoleResponse> iCaseRoles;
        var caseRoles2 = await _bookingsApiClient.GetCaseRolesForCaseServiceAsync(caseTypeParameter);
        iCaseRoles = caseRoles2?.Select(e => (ICaseRoleResponse)e).ToList();


        if (iCaseRoles != null && iCaseRoles.Any())
        {
            foreach (var caseRoleName in iCaseRoles.Select(cr => cr.Name))
            {
                var caseRole = new CaseAndHearingRolesResponse { Name = caseRoleName };
                List<IHearingRoleResponse> iHearingRoles;
                var hearingRoles1 =
                    await _bookingsApiClient.GetHearingRolesForCaseRoleV2Async(caseTypeParameter, caseRoleName);
                iHearingRoles = hearingRoles1.Select(e => (IHearingRoleResponse)e).ToList();

                caseRole.HearingRoles = iHearingRoles.ConvertAll(x => new HearingRole(x.Name, x.UserRole));

                response.Add(caseRole);
            }
        }

        return Ok(response);
    }
}