using AdminWebsite.Contracts.Responses;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using AdminWebsite.Models;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/user")]
    public class UserIdentityController : ControllerBase
    {
        [HttpGet]
        [SwaggerOperation(OperationId = "GetUserProfile")]
        [ProducesResponseType(typeof(UserProfileResponse), (int)HttpStatusCode.OK)]
        public ActionResult<UserProfileResponse> GetUserProfile()
        {
            var profile = new UserProfileResponse
            {
                IsVhOfficerAdministratorRole = User.IsInRole(AppRoles.VhOfficerRole),
                IsCaseAdministrator = User.IsInRole(AppRoles.CaseAdminRole)
            };

            return Ok(profile);
        }
    }
}
