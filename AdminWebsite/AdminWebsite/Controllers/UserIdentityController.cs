using AdminWebsite.Contracts.Responses;
using AdminWebsite.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using System.Threading.Tasks;

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
        public async Task<ActionResult<UserProfileResponse>> GetUserProfile()
        {
            var profile = new UserProfileResponse
            {
                IsVhOfficerAdministratorRole = await _userIdentity.IsVhOfficerAdministratorRole(),
                IsCaseAdministrator = await _userIdentity.IsCaseAdministratorRole()
            };
           
            return Ok(profile);
        }
    }
}
