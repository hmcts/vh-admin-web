using AdminWebsite.Models;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;

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
    }
}
