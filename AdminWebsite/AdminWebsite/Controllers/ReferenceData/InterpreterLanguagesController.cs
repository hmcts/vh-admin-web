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
/// Responsible for retrieving interpreter languages reference data when requesting a booking.
/// </summary>
public class InterpreterLanguagesController : ReferenceDataControllerBase
{
    private readonly IReferenceDataService _referenceDataService;

    /// <summary>
    /// Instantiate the controller
    /// </summary>
    public InterpreterLanguagesController(IReferenceDataService referenceDataService)
    {
        _referenceDataService = referenceDataService;
    }
    
    /// <summary>
    /// Get available languages for interpreters
    /// </summary>
    /// <returns>List of languages</returns>
    [HttpGet("available-languages", Name = "GetAvailableLanguages")]
    [ProducesResponseType(typeof(IList<AvailableLanguageResponse>), (int)HttpStatusCode.OK)]
    public async Task<ActionResult<IList<AvailableLanguageResponse>>> GetAvailableLanguages()
    {
        var response = await _referenceDataService.GetInterpreterLanguagesAsync();
        return Ok(response.OrderBy(x => x.Value).Select(AvailableLanguageResponseMapper.Map).ToList());
    }
}