using AdminWebsite.Models;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Contract.Responses;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/workhours")]
    public class WorkHoursController : ControllerBase
    {

        private readonly IBookingsApiClient _bookingsApiClient;

        public WorkHoursController(IBookingsApiClient bookingsApiClient)
        {
            _bookingsApiClient = bookingsApiClient;
        }

        [HttpPost("UploadWorkHours")]
        [SwaggerOperation(OperationId = "UploadWorkHours")]
        [ProducesResponseType(typeof(UploadWorkHoursResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> UploadWorkHours([FromBody] List<UploadWorkHoursRequest> request)
        {
            var failedUsernames = await _bookingsApiClient.SaveWorkHoursAsync(request);

            var uploadWorkHoursResponse = new UploadWorkHoursResponse();
            uploadWorkHoursResponse.FailedUsernames.AddRange(failedUsernames);

            return Ok(uploadWorkHoursResponse);
        }

        [HttpPost("UploadNonWorkingHours")]
        [SwaggerOperation(OperationId = "UploadNonWorkingHours")]
        [ProducesResponseType(typeof(UploadNonWorkingHoursResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> UploadNonWorkingHours([FromBody] List<UploadNonWorkingHoursRequest> request)
        {
            var failedUsernames = await _bookingsApiClient.SaveNonWorkingHoursAsync(request);

            var uploadWorkHoursResponse = new UploadNonWorkingHoursResponse();
            uploadWorkHoursResponse.FailedUsernames.AddRange(failedUsernames);

            return Ok(uploadWorkHoursResponse);
        }
        
        [HttpGet("VHO")]
        [SwaggerOperation(OperationId = "GetWorkAvailabilityHours")]
        [ProducesResponseType(typeof(List<VhoWorkHoursResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetWorkAvailabilityHours(string vho)
        {
            try
            {
                return Ok(await _bookingsApiClient.GetVhoWorkAvailabilityHoursAsync(vho.ToLowerInvariant().Trim()));
            }
            catch(BookingsApiException ex)
            {
                switch (ex.StatusCode)
                {
                    case (int)HttpStatusCode.NotFound:
                        return NotFound("User could not be found. Please check the username and try again");
                    case (int)HttpStatusCode.BadRequest:
                        return BadRequest(ex.Response);
                    default:
                        throw;
                }
            }
        }
        
                
        [HttpGet("/NonAvailability/VHO")]
        [SwaggerOperation(OperationId = "GetNonAvailabilityWorkHours")]
        [ProducesResponseType(typeof(List<VhoNonAvailabilityWorkHoursResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetNonAvailabilityWorkHours(string vho)
        {
            try
            {
                return Ok(await _bookingsApiClient.GetVhoNonAvailabilityHoursAsync(vho.ToLowerInvariant().Trim()));
            }
            catch(BookingsApiException ex)
            {
                switch (ex.StatusCode)
                {
                    case (int)HttpStatusCode.NotFound:
                        return NotFound("User could not be found. Please check the username and try again");
                    case (int)HttpStatusCode.BadRequest:
                        return BadRequest(ex.Response);
                    default:
                        throw;
                }
            }
        }
        
        [HttpDelete("/NonAvailability")]
        [SwaggerOperation(OperationId = "DeleteNonAvailabilityWorkHours")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> DeleteNonAvailabilityWorkHours(long id)
        {
            try
            {
                await _bookingsApiClient.DeleteVhoNonAvailabilityHoursAsync(id);
                return Ok();
            }
            catch(BookingsApiException ex)
            {
                switch (ex.StatusCode)
                {
                    case (int)HttpStatusCode.NotFound:
                        return NotFound("Record could not be found. Please check the id and try again");
                    case (int)HttpStatusCode.BadRequest:
                        return BadRequest(ex.Response);
                    default:
                        throw;
                }
            }
        }
    }
}
