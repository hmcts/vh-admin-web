using AdminWebsite.Contracts.Responses;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using AdminWebsite.Models;
using BookingsApi.Client;
using System.Threading.Tasks;
using System.Linq;
using AdminWebsite.Helper;
using System;
using BookingsApi.Contract.Responses;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/user")]
    public class UserIdentityController : ControllerBase
    {

        private readonly IBookingsApiClient _bookingsApiClient;

        public UserIdentityController(IBookingsApiClient bookingsApiClient)
        {
            _bookingsApiClient = bookingsApiClient;
        }

        [HttpGet]
        [SwaggerOperation(OperationId = "GetUserProfile")]
        [ProducesResponseType(typeof(UserProfileResponse), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<UserProfileResponse>> GetUserProfile()
        {
            var username = User.Claims.SingleOrDefault(x => x.Type == ClaimNames.PreferredUsername)?.Value;
            JusticeUserResponse justiceUser = null;
            
            try
            {
                justiceUser = await _bookingsApiClient
                    .GetJusticeUserByUsernameAsync(username);
            }
            catch(BookingsApiException e)
            {
                if (e.StatusCode != 404)
                    return StatusCode(e.StatusCode, e.Response);
            }
            var profile = new UserProfileResponse
            {
                IsVhOfficerAdministratorRole = User.IsInRole(AppRoles.VhOfficerRole),
                IsVhTeamLeader = justiceUser != null && justiceUser.IsVhTeamLeader,
                IsCaseAdministrator = User.IsInRole(AppRoles.CaseAdminRole)
            };

            return Ok(profile);
        }
    }
}
