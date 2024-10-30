using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Services;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.Controllers.ReferenceData;

/// <summary>
/// Responsible for retrieving hearing venues reference data when requesting a booking.
/// </summary>
public class HearingVenuesController : ReferenceDataControllerBase
{
    private readonly IReferenceDataService _referenceDataService;

    /// <summary>
    /// Instantiate the controller
    /// </summary>
    public HearingVenuesController(IReferenceDataService referenceDataService)
    {
        _referenceDataService = referenceDataService;
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
        var response = await _referenceDataService.GetHearingVenuesAsync();
        return Ok(response);
    }
}