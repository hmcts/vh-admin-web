using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.Controllers.ReferenceData;

/// <summary>
/// Responsible for retrieving hearing types reference data when requesting a booking.
/// </summary>
public class HearingTypesController : ReferenceDataControllerBase
{
    private readonly IReferenceDataService _referenceDataService;

    /// <summary>
    /// Instantiate the controller
    /// </summary>
    public HearingTypesController(IReferenceDataService referenceDataService)
    {
        _referenceDataService = referenceDataService;
    }

    /// <summary>
    ///     Gets a list hearing types
    /// </summary>
    /// <returns>List of hearing types</returns>
    [HttpGet("types", Name = "GetHearingTypes")]
    [ProducesResponseType(typeof(IList<HearingTypeResponse>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<ActionResult<IList<HearingTypeResponse>>> GetHearingTypes(
        [FromQuery] bool includeDeleted = false)
    {
        var caseTypes = await _referenceDataService.GetNonDeletedCaseTypesAsync();
        var result = caseTypes.SelectMany(caseType => caseType.HearingTypes
            .Select(hearingType => new HearingTypeResponse
            {
                Group = caseType.Name,
                Id = hearingType.Id,
                Name = hearingType.Name,
                ServiceId = caseType.ServiceId,
                Code = hearingType.Code
            })).ToList();

        result.AddRange(caseTypes.Where(ct => !ct.HearingTypes.Any())
            .Select(caseType => new HearingTypeResponse
            {
                Group = caseType.Name,
                ServiceId = caseType.ServiceId
            }));

        return Ok(result);
    }
}