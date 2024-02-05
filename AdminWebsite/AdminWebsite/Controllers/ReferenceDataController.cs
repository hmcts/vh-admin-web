using AdminWebsite.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers;
using AdminWebsite.Services;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.Interfaces.Response;
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
        private readonly IPublicHolidayRetriever _publicHolidayRetriever;
        private readonly IFeatureToggles _featureToggles;

        /// <summary>
        /// Instantiate the controller
        /// </summary>
        public ReferenceDataController(
            IBookingsApiClient bookingsApiClient, 
            IPublicHolidayRetriever publicHolidayRetriever,
            IFeatureToggles featureToggles)
        {
            _bookingsApiClient = bookingsApiClient;
            _publicHolidayRetriever = publicHolidayRetriever;
            _featureToggles = featureToggles;
        }

        /// <summary>
        ///     Gets a list hearing types
        /// </summary>
        /// <returns>List of hearing types</returns>
        [HttpGet("types", Name = "GetHearingTypes")]
        [ProducesResponseType(typeof(IList<HearingTypeResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<HearingTypeResponse>>> GetHearingTypes([FromQuery] bool includeDeleted = false)
        {
            var caseTypes = await _bookingsApiClient.GetCaseTypesAsync(includeDeleted);
            var result = caseTypes.SelectMany(caseType => caseType.HearingTypes
                .Select(hearingType => new HearingTypeResponse
            {
                Group = caseType.Name,
                Id = hearingType.Id,
                Name = hearingType.Name,
                ServiceId = caseType.ServiceId,
                Code = hearingType.Code
            } )).ToList();
            
            if (_featureToggles.UseV2Api())
                result.AddRange(caseTypes.Where(ct => !ct.HearingTypes.Any())
                    .Select(caseType => new HearingTypeResponse
                    {
                        Group = caseType.Name,
                        ServiceId = caseType.ServiceId
                    }));

            return Ok(result);
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
            if (_featureToggles.ReferenceDataToggle())
            {
                var caseRoles2 = await _bookingsApiClient.GetCaseRolesForCaseServiceAsync(caseTypeParameter);
                iCaseRoles = caseRoles2?.Select(e => (ICaseRoleResponse)e).ToList();
            }
            else
            {
                var caseRoles1 = await _bookingsApiClient.GetCaseRolesForCaseTypeAsync(caseTypeParameter);
                iCaseRoles = caseRoles1?.Select(e => (ICaseRoleResponse)e).ToList();
            }
        
            if (iCaseRoles != null && iCaseRoles.Any())
            {
                foreach (var caseRolName in iCaseRoles.Select(cr => cr.Name))
                {
                    var caseRole = new CaseAndHearingRolesResponse { Name = caseRolName };
                    List<IHearingRoleResponse> iHearingRoles;
                    if (_featureToggles.ReferenceDataToggle())
                    {
                        var hearingRoles1 = await _bookingsApiClient.GetHearingRolesForCaseRoleV2Async(caseTypeParameter, caseRolName);
                        iHearingRoles = hearingRoles1.Select(e => (IHearingRoleResponse)e).ToList();
                    }
                    else
                    {
                        var hearingRoles2 = await _bookingsApiClient.GetHearingRolesForCaseRoleAsync(caseTypeParameter, caseRolName);  
                        iHearingRoles = hearingRoles2.Select(e => (IHearingRoleResponse)e).ToList();
                    }
                    
                    caseRole.HearingRoles = iHearingRoles.ConvertAll(x => new HearingRole(x.Name, x.UserRole));

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
            var response = await _bookingsApiClient.GetHearingVenuesAsync(true);
            return Ok(response);
        }

        /// <summary>
        ///     Get upcoming public holidays in England and Wales
        /// </summary>
        /// <returns>List upcoming public holidays</returns>
        [HttpGet("public-holidays")]
        [ProducesResponseType(typeof(IList<PublicHolidayResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<PublicHolidayResponse>>> PublicHolidays()
        {
            var holidays = await _publicHolidayRetriever.RetrieveUpcomingHolidays();
            var response = holidays.Select(PublicHolidayResponseMapper.MapFrom).ToList();
            return Ok(response);
        }
    }
}