using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers;
using BookingsApi.Client;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/hearingroles")]
    [ApiController]
    public class HearingRolesController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;

        public HearingRolesController(IBookingsApiClient bookingsApiClient)
        {
            _bookingsApiClient = bookingsApiClient;
        }
        
        [HttpGet]
        [SwaggerOperation(OperationId = "GetHearingRoles")]
        [ProducesResponseType(typeof(List<HearingRoleResponse>), (int) HttpStatusCode.OK)]
        public async Task<IActionResult> GetHearingRoles()
        {
            var hearingRoles = await _bookingsApiClient.GetHearingRolesAsync();
            
            var response = hearingRoles.Select(item => item.Map()).ToList();

            return Ok(response);
        }
    }
}
