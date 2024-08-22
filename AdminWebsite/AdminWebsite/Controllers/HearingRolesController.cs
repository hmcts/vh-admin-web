using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/hearingroles")]
    [ApiController]
    public class HearingRolesController : ControllerBase
    {
        private readonly IReferenceDataService _referenceDataService;

        public HearingRolesController(IReferenceDataService referenceDataService)
        {
            _referenceDataService = referenceDataService;
        }
        
        [HttpGet]
        [SwaggerOperation(OperationId = "GetHearingRoles")]
        [ProducesResponseType(typeof(List<HearingRoleResponse>), (int) HttpStatusCode.OK)]
        public async Task<IActionResult> GetHearingRoles(CancellationToken cancellationToken)
        {
            var hearingRoles = await _referenceDataService.GetHearingRolesAsync(cancellationToken);
            var response = hearingRoles.Select(item => item.Map()).ToList();
            return Ok(response);
        }
    }
}
