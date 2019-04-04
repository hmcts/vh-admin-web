using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Helper;
using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using Microsoft.Extensions.Options;
using Microsoft.Graph;
using Newtonsoft.Json;
using AdminWebsite.Configuration;
using AdminWebsite.UserAPI.Client;
using UserServiceException = AdminWebsite.Security.UserServiceException;

namespace AdminWebsite.Services
{
    public interface IUserAccountService
    {
        Group GetGroupById(string groupId);

        IEnumerable<JudgeResponse> GetJudgeUsers();
       
        Task UpdateParticipantUsername(ParticipantRequest participant);
    }

    public class UserAccountService : IUserAccountService
    {
        private readonly IUserApiClient _userApiClient;
        private readonly ITokenProvider _tokenProvider;
        private readonly SecuritySettings _securitySettings;
        private readonly bool _isLive;

        private static readonly Compare<JudgeResponse> CompareJudgeById =
            Compare<JudgeResponse>.By((x, y) => x.Email == y.Email, x => x.Email.GetHashCode());
        
        public UserAccountService(IUserApiClient userApiClient, ITokenProvider tokenProvider, IOptions<SecuritySettings> securitySettings, IOptions<AppConfigSettings> appSettings)
        {
            _userApiClient = userApiClient;
            _tokenProvider = tokenProvider;
            _securitySettings = securitySettings.Value;
            _isLive = appSettings.Value.IsLive;
        }

        public async Task UpdateParticipantUsername(ParticipantRequest participant)
        {
            //// create user in AD if users email does not exist in AD.
            var userProfile = await CheckUserExistsInAD(participant.Contact_email);
            if (userProfile == null)
            {
                // create the user in AD.
                await CreateNewUserInAD(participant);
            }
            else
            {
                participant.Username = userProfile.User_name;
            }
        }
        
        private async Task<UserProfile> CheckUserExistsInAD(string emailAddress)
        {
            try
            {
                return await _userApiClient.GetUserByEmailAsync(emailAddress);
            }
            catch(UserAPI.Client.UserServiceException e)
            {
                if (e.StatusCode == (int) HttpStatusCode.NotFound)
                {
                    return null;
                }

                throw;
            }
        }

        private async Task<NewUserResponse> CreateNewUserInAD(ParticipantRequest participant)
        {
            var createUserRequest = new CreateUserRequest
            {
                First_name = participant.First_name,
                Last_name = participant.Last_name,
                Recovery_email = participant.Contact_email
            };

            var newUserResponse = await _userApiClient.CreateUserAsync(createUserRequest);

            participant.Username = newUserResponse.Username;

            // Add user to user group.
            var addUserToGroupRequest = new AddUserToGroupRequest
            {
                User_id = newUserResponse.User_id,
                Group_name = "External"
            };

            await _userApiClient.AddUserToGroupAsync(addUserToGroupRequest);

            if (participant.Hearing_role_name == "Solicitor")
            {
                addUserToGroupRequest = new AddUserToGroupRequest()
                {
                    User_id = newUserResponse.User_id,
                    Group_name = "VirtualRoomProfessionalUser"
                };
                await _userApiClient.AddUserToGroupAsync(addUserToGroupRequest);
            }
            return newUserResponse;
        }


        public Group GetGroupByName(string groupName)
        {
            var accessToken = _tokenProvider.GetClientAccessToken(_securitySettings.ClientId,
                _securitySettings.ClientSecret, _securitySettings.GraphApiBaseUri);

            HttpResponseMessage responseMessage;
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                var httpRequestMessage = new HttpRequestMessage(HttpMethod.Get,
                    $"{_securitySettings.GraphApiBaseUri}v1.0/groups?$filter=displayName eq '{groupName}'");
                responseMessage = client.SendAsync(httpRequestMessage).Result;
            }

            if (responseMessage.IsSuccessStatusCode)
            {
                var queryResponse = responseMessage.Content.ReadAsAsync<GraphQueryResponse>().Result;
                return queryResponse.Value?.FirstOrDefault();
            }

            var message = $"Failed to get group by name {groupName}";
            var reason = responseMessage.Content.ReadAsStringAsync().Result;
            throw new UserServiceException(message, reason);
        }

        public Group GetGroupById(string groupId)
        {
            var accessToken = _tokenProvider.GetClientAccessToken(_securitySettings.ClientId,
                _securitySettings.ClientSecret, _securitySettings.GraphApiBaseUri);

            HttpResponseMessage responseMessage;
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                var httpRequestMessage =
                    new HttpRequestMessage(HttpMethod.Get, $"{_securitySettings.GraphApiBaseUri}v1.0/groups/{groupId}");
                responseMessage = client.SendAsync(httpRequestMessage).Result;
            }

            if (responseMessage.IsSuccessStatusCode)
            {
                return responseMessage.Content.ReadAsAsync<Group>().Result;
            }

            if (responseMessage.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }

            var message = $"Failed to get group by id {groupId}";
            var reason = responseMessage.Content.ReadAsStringAsync().Result;
            throw new UserServiceException(message, reason);
        }

        public IEnumerable<JudgeResponse> GetJudgeUsers()
        {
            var judges = GetUsersByGroupName("VirtualRoomJudge");
            if (_isLive)
                judges = ExcludeTestJudges(judges).ToList();

            return judges.OrderBy(j => j.DisplayName);
        }

        private IEnumerable<JudgeResponse> ExcludeTestJudges(IEnumerable<JudgeResponse> judgesList)
        {
            var judgesTest = GetUsersByGroupName("TestAccount");
            return judgesList.Except(judgesTest, CompareJudgeById);
        }

        public List<JudgeResponse> GetUsersByGroupName(string groupName)
        {
            Group groupData = GetGroupByName(groupName);
            if (groupData == null) return new List<JudgeResponse>();

            var response = GetUsersByGroup(groupData.Id);
            if (response != null)
            {
                return response.Select(x => new JudgeResponse
                {
                    FirstName = x.GivenName,
                    LastName = x.Surname,
                    DisplayName = x.DisplayName,
                    Email = x.UserPrincipalName
                }).ToList();
            }
            return new List<JudgeResponse>();
        }

        public List<User> GetUsersByGroup(string groupId)
        {
            var accessToken = _tokenProvider.GetClientAccessToken(_securitySettings.ClientId,
                _securitySettings.ClientSecret,
                _securitySettings.GraphApiBaseUri);

            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                var httpRequestMessage = new HttpRequestMessage(HttpMethod.Get, $"{_securitySettings.GraphApiBaseUri}v1.0/groups/{groupId}/members");

                var queryResponse = client.SendAsync(httpRequestMessage).Result.Content.ReadAsAsync<DirectoryObject>().Result;
                return JsonConvert.DeserializeObject<List<User>>(queryResponse.AdditionalData["value"].ToString());
            }
        }
    }
}
