using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using HearingDetailsResponse = BookingsApi.Contract.V1.Responses.HearingDetailsResponse;

namespace AdminWebsite.Controllers
{
    /// <summary>
    ///     Responsible for retrieving and storing work allocation information
    /// </summary>
    [Produces("application/json")]
    [Consumes("application/json")]
    [Route("api/work-allocation")]
    [ApiController]
    public class WorkAllocationController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;

        public WorkAllocationController(IBookingsApiClient bookingsApiClient)
        {
            _bookingsApiClient = bookingsApiClient;
        }

        [HttpGet("unallocated")]
        [SwaggerOperation(OperationId = "GetUnallocatedHearings")]
        [ProducesResponseType(typeof(UnallocatedHearingsForVhoResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetUnallocatedHearings()
        {
            var unallocatedHearings = await _bookingsApiClient.GetUnallocatedHearingsAsync();

            if (unallocatedHearings == null || unallocatedHearings.Count == 0)
                return Ok(UnallocatedHearingsForVhoMapper.MapFrom(new List<HearingDetailsResponse>(), DateTime.Today));

            return Ok(UnallocatedHearingsForVhoMapper.MapFrom(unallocatedHearings.ToList(), DateTime.Today));
        }

        [HttpGet("allocation")]
        [SwaggerOperation(OperationId = "GetAllocationHearings")]
        [ProducesResponseType(typeof(List<AllocationHearingsResponse>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetAllocationHearings(
            [FromQuery] SearchForAllocationHearingsRequest searchRequest)
        {
            var hearings = await _bookingsApiClient.SearchForAllocationHearingsAsync(
                fromDate: searchRequest.FromDate,
                toDate: searchRequest.ToDate,
                caseNumber: searchRequest.CaseNumber,
                caseType: searchRequest.CaseType,
                cso: searchRequest.Cso,
                isUnallocated: searchRequest.IsUnallocated);

            if (hearings == null || hearings.Count == 0)
                return Ok(new List<AllocationHearingsResponse>());

            return Ok(hearings.Select(AllocationHearingsResponseMapper.Map));
        }

        /// <summary>
        ///     Update the hearing status.
        /// </summary>
        /// <param name="request"></param>
        /// <returns>Success status</returns>
        [HttpPatch("allocations")]
        [SwaggerOperation(OperationId = "AllocateHearingsToCso")]
        [ProducesResponseType(typeof(List<AllocationHearingsResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
        [Authorize(AppRoles.AdministratorRole)]
        public async Task<IActionResult> AllocateHearingsToCso(UpdateHearingAllocationToCsoRequest request)
        {
            var hearings = await _bookingsApiClient.AllocateHearingsToCsoAsync(request);

            if (hearings == null || hearings.Count == 0)
                return Ok(new List<AllocationHearingsResponse>());

            return Ok(hearings.Select(AllocationHearingsResponseMapper.Map).ToList());
        }
    }
}