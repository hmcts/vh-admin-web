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

        IEnumerable<ParticipantDetailsResponse> GetUsersByGroup();
       
        Task UpdateParticipantUsername(ParticipantRequest participant);
    }

    public class UserAccountService : IUserAccountService
    {
        private readonly IUserApiClient _userApiClient;
        private readonly ITokenProvider _tokenProvider;
        private readonly SecuritySettings _securitySettings;
        private readonly bool _isLive;
        
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
                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    return null;
                }
            }
            return null;
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
            if (newUserResponse == null) 
                return null;

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

        public IEnumerable<ParticipantDetailsResponse> GetUsersByGroup()
        {
            var judges = GetUsersByGroupName("VirtualRoomJudge");
            if (_isLive)
                judges = ExcludeTestJudges(judges);

            judges = judges.OrderBy(j => j.DisplayName);
            return judges;
        }

        private IEnumerable<ParticipantDetailsResponse> ExcludeTestJudges(IEnumerable<ParticipantDetailsResponse> judgesList)
        {
            var judgesTest = GetUsersByGroupName("TestAccount");
            judgesList = judgesList.Except(judgesTest);
            
            return judgesList;
        }

        public IEnumerable<ParticipantDetailsResponse> GetUsersByGroupName(string groupName)
        {
            Group groupData = GetGroupByName(groupName);
            if (groupData == null) return new List<ParticipantDetailsResponse>();

            List<User> response = GetUsersByGroup(groupData.Id);
            if (response != null || response.Any())
            {
                IEnumerable<ParticipantDetailsResponse> judges = response.Select(x => new ParticipantDetailsResponse()
                {
                    Id = x.Id,
                    FirstName = x.GivenName,
                    MiddleName = "",
                    LastName = x.Surname,
                    DisplayName = x.DisplayName,
                    Email = x.UserPrincipalName,
                    Phone = x.MobilePhone,
                    Role = x.JobTitle
                });
                return judges;
            }
            return new List<ParticipantDetailsResponse>();
        }

        public List<User> GetUsersByGroup(string groupId)
        {
            string accessToken = _tokenProvider.GetClientAccessToken(_securitySettings.ClientId,
                _securitySettings.ClientSecret,
                _securitySettings.GraphApiBaseUri);

            using (HttpClient client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                HttpRequestMessage httpRequestMessage = new HttpRequestMessage(HttpMethod.Get, $"{_securitySettings.GraphApiBaseUri}v1.0/groups/{groupId}/members");

                DirectoryObject queryResponse = client.SendAsync(httpRequestMessage).Result.Content.ReadAsAsync<DirectoryObject>().Result;
                List<User> users = JsonConvert.DeserializeObject<List<User>>(queryResponse.AdditionalData["value"].ToString());
                return users;
            }
        }
    }
}
