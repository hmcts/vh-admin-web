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
    public async Task<ActionResult<IList<HearingTypeResponse>>> GetHearingTypes()
    {
        var caseTypes = await _referenceDataService.GetNonDeletedCaseTypesAsync();
        var result = caseTypes.Select(caseType => new HearingTypeResponse
            {
                Group = caseType.Name,
                Id = caseType.Id,
                ServiceId = caseType.ServiceId,
                IsAudioRecordingAllowed = true // TODO get from bookings api
            }).ToList();

        // TODO get from bookings api
        foreach (var type in result.Where(type => type.ServiceId is "VIHTMP1" or "VIHTMP8"))
        {
            type.IsAudioRecordingAllowed = false;
        }

        return Ok(result);
    }
}