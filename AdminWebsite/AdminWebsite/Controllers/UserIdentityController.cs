using AdminWebsite.Contracts.Responses;
using AdminWebsite.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/user")]
    public class UserIdentityController : ControllerBase
    {
        private readonly IUserIdentity _userIdentity;

        public UserIdentityController(IUserIdentity userIdentity)
        {
            _userIdentity = userIdentity;
        }

        [HttpGet]
        [SwaggerOperation(OperationId = "GetUserProfile")]
        [ProducesResponseType(typeof(UserProfileResponse), (int)HttpStatusCode.OK)]
        public ActionResult<UserProfileResponse> GetUserProfile()
        {
            var profile = new UserProfileResponse
            {
                IsVhOfficerAdministratorRole = _userIdentity.IsVhOfficerAdministratorRole(),
                IsCaseAdministrator = _userIdentity.IsCaseAdministratorRole()
            };

            return Ok(profile);
        }
    }
}
