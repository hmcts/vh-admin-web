﻿using AdminWebsite.Models;
using BookingsApi.Client;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Authorization;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Consumes("application/json")]
    [Route("api/workhours")]
    [Authorize(AppRoles.AdministratorRole)]
    public class WorkHoursController : ControllerBase
    {

        private readonly IBookingsApiClient _bookingsApiClient;

        public WorkHoursController(IBookingsApiClient bookingsApiClient)
        {
            _bookingsApiClient = bookingsApiClient;
        }

        [HttpPost("UploadWorkHours")]
        [SwaggerOperation(OperationId = "UploadWorkHours")]
        [ProducesResponseType(typeof(UploadWorkHoursResponse), (int) HttpStatusCode.OK)]
        public async Task<IActionResult> UploadWorkHours([FromBody] List<UploadWorkHoursRequest> request)
        {
            var failedUsernames = await _bookingsApiClient.SaveWorkHoursAsync(request);

            var uploadWorkHoursResponse = new UploadWorkHoursResponse();
            uploadWorkHoursResponse.FailedUsernames.AddRange(failedUsernames);

            return Ok(uploadWorkHoursResponse);
        }

        [HttpPost("UploadNonWorkingHours")]
        [SwaggerOperation(OperationId = "UploadNonWorkingHours")]
        [ProducesResponseType(typeof(UploadNonWorkingHoursResponse), (int) HttpStatusCode.OK)]
        public async Task<IActionResult> UploadNonWorkingHours([FromBody] List<UploadNonWorkingHoursRequest> request)
        {
            var failedUsernames = await _bookingsApiClient.SaveNonWorkingHoursAsync(request);

            var uploadWorkHoursResponse = new UploadNonWorkingHoursResponse();
            uploadWorkHoursResponse.FailedUsernames.AddRange(failedUsernames);

            return Ok(uploadWorkHoursResponse);
        }

        [HttpGet("VHO")]
        [SwaggerOperation(OperationId = "GetWorkAvailabilityHours")]
        [ProducesResponseType(typeof(List<VhoWorkHoursResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetWorkAvailabilityHours(string vho)
        {
            try
            {
                return Ok(await _bookingsApiClient.GetVhoWorkAvailabilityHoursAsync(vho.ToLowerInvariant().Trim()));
            }
            catch (BookingsApiException ex)
            {
                switch (ex.StatusCode)
                {
                    case (int) HttpStatusCode.NotFound:
                        return NotFound("User could not be found. Please check the username and try again");
                    case (int) HttpStatusCode.BadRequest:
                        return BadRequest(ex.Response);
                    default:
                        throw;
                }
            }
        }


        [HttpGet("NonAvailability/VHO")]
        [SwaggerOperation(OperationId = "GetNonAvailabilityWorkHours")]
        [ProducesResponseType(typeof(List<VhoNonAvailabilityWorkHoursResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetNonAvailabilityWorkHours(string vho)
        {
            try
            {
                return Ok(await _bookingsApiClient.GetVhoNonAvailabilityHoursAsync(vho.ToLowerInvariant().Trim()));
            }
            catch (BookingsApiException ex)
            {
                switch (ex.StatusCode)
                {
                    case (int) HttpStatusCode.NotFound:
                        return NotFound("User could not be found. Please check the username and try again");
                    case (int) HttpStatusCode.BadRequest:
                        return BadRequest(ex.Response);
                    default:
                        throw;
                }
            }
        }

        /// <summary>
        /// Updates non availability hours for a vho
        /// </summary>
        /// <param name="username"></param>
        /// <param name="request"></param>
        /// <returns>Success status</returns>
        [HttpPatch("NonAvailability/VHO/{username}")]
        [SwaggerOperation(OperationId = "UpdateNonAvailabilityWorkHours")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        public async Task<IActionResult> UpdateNonAvailabilityWorkHours(string username,
            [FromBody] UpdateNonWorkingHoursRequest request)
        {
            try
            {
                await _bookingsApiClient.UpdateVhoNonAvailabilityHoursAsync(username, request);
                return NoContent();
            }
            catch (BookingsApiException ex)
            {
                switch (ex.StatusCode)
                {
                    case (int) HttpStatusCode.NotFound:
                        return NotFound();
                    case (int) HttpStatusCode.BadRequest:
                        return BadRequest(ex.Response);
                    default:
                        throw;
                }
            }
        }

        [HttpDelete("NonAvailability/{username}/{nonAvailabilityId}")]
        [SwaggerOperation(OperationId = "DeleteNonAvailabilityWorkHours")]
        [ProducesResponseType((int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public async Task<IActionResult> DeleteNonAvailabilityWorkHours([FromRoute] string username, [FromRoute] long nonAvailabilityId)
        {
            try
            {
                await _bookingsApiClient.DeleteVhoNonAvailabilityHoursAsync(username, nonAvailabilityId);
                return Ok();
            }
            catch (BookingsApiException ex)
            {
                switch (ex.StatusCode)
                {
                    case (int)HttpStatusCode.BadRequest:
                    {
                        var typedException = ex as BookingsApiException<ValidationProblemDetails>;
                        return ValidationProblem(typedException!.Result);
                    }
                    case (int)HttpStatusCode.NotFound:
                        return NotFound("Record could not be found. Please check the id and try again");
                    default:
                        throw;
                }
            }
        }
    }
}
