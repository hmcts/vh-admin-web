using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using Microsoft.AspNetCore.Authorization;
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

        [HttpPost]
        [SwaggerOperation(OperationId = "UploadWorkHours")]
        [ProducesResponseType(typeof(List<string>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> UploadWorkHours([FromBody] List<UploadWorkHoursRequest> request)
        {
            var failedUsernames = await _bookingsApiClient.SaveWorkHoursAsync(request);

            return Ok(failedUsernames);
        }
    }
}
