using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.Controllers.ReferenceData;

/// <summary>
/// Responsible for retrieving case types reference data when requesting a booking.
/// </summary>
public class CaseTypesController : ReferenceDataControllerBase
{
    private readonly IReferenceDataService _referenceDataService;

    /// <summary>
    /// Instantiate the controller
    /// </summary>
    public CaseTypesController(IReferenceDataService referenceDataService)
    {
        _referenceDataService = referenceDataService;
    }

    /// <summary>
    ///     Gets a list of case types
    /// </summary>
    /// <returns>List of case types</returns>
    [HttpGet("types", Name = "GetCaseTypes")]
    [ProducesResponseType(typeof(IList<CaseTypeResponse>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<ActionResult<IList<CaseTypeResponse>>> GetCaseTypes()
    {
        var caseTypes = await _referenceDataService.GetNonDeletedCaseTypesAsync();
        var result = caseTypes.Select(t => t.Map()).ToList();

        return Ok(result);
    }
}