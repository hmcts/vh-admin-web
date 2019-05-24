using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using AdminWebsite.UserAPI.Client;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace AdminWebsite.Services
{
    public interface IUserAccountService
    {
        /// <summary>
        ///     Returns a list of all judges in the active directory
        /// </summary>
        /// <remarks>
        /// Filters test accounts if configured to run as live environment 
        /// </remarks>
        IEnumerable<JudgeResponse> GetJudgeUsers();

        /// <summary>
        /// 
        /// </summary>
        /// <param name="userName"></param>
        /// <returns></returns>
        Task<UserRole> GetUserRoleAsync(string userName);

        /// <summary>
        ///     Returns the username / creates a user if one does not exist. 
        /// </summary>
        /// <param name="participant"></param>
        /// <returns></returns>
        Task CreateUser(ParticipantRequest participant);
    }

    public class UserAccountService : IUserAccountService
    {
        private readonly IUserApiClient _userApiClient;
        private const string INDIVIDUAL = "Individual";
        private const string REPRESENTATIVE = "Representative";
        private const string SOLICITOR = "Solicitor";

        /// <summary>
        /// Create the service
        /// </summary>
        /// <param name="userApiClient"></param>
        public UserAccountService(IUserApiClient userApiClient)
        {
            _userApiClient = userApiClient;
        }

        public async Task<UserRole> GetUserRoleAsync(string userName)
        {
            var user = await _userApiClient.GetUserByAdUserNameAsync(userName);
            Enum.TryParse<UserRoleType>(user.User_role, out var userRoleResult);

            return new UserRole { UserRoleType = userRoleResult, CaseTypes = user.Case_type };
        }

        /// <inheritdoc />
        public IEnumerable<JudgeResponse> GetJudgeUsers()
        {
            var judgesList = _userApiClient.GetJudges();
            return judgesList.Select(x => new JudgeResponse
            {
                FirstName = x.First_name,
                LastName = x.Last_name,
                DisplayName = x.Display_name,
                Email = x.Email
            }).ToList();
        }

        /// <summary>
        /// This method calls the user api to create a user and add the user to group, 
        /// if the user does not exist in the system.
        /// if the user exists the username will be returned. 
        /// </summary>
        /// <param name="participant"></param>
        /// <returns></returns>
        public async Task CreateUser(ParticipantRequest participant)
        {
            CreateUserRequest createUserRequest = new CreateUserRequest
            {
                First_name = participant.First_name,
                Last_name = participant.Last_name,
                Recovery_email = participant.Contact_email,
                User_role = GetUserRole(participant.Hearing_role_name)
            };
            try
            {
                var userProfile = await _userApiClient.CreateUserAsync(createUserRequest);
                if (userProfile != null)
                {
                    participant.Username = userProfile.Username;
                }
            }
            catch (UserAPI.Client.UserServiceException e)
            {
                if (e.Response != null)
                {
                    ConflictResponse conflictResponse = JsonConvert.DeserializeObject<ConflictResponse>(e.Response);
                    participant.Username = conflictResponse.Username;
                }
            }
        }

        private string GetUserRole(string hearingRoleName)
        {
            string userRole = string.Empty;
            switch(hearingRoleName)
            {
                case SOLICITOR:
                    userRole = REPRESENTATIVE;
                    break;
                default:
                    userRole = INDIVIDUAL;
                    break;
            }
            return userRole;
        }
    }
}
