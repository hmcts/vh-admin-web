using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Helper;
using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using Hearings.Common;
using Microsoft.Extensions.Options;
using Microsoft.Graph;
using Newtonsoft.Json;
using AdminWebsite.Configuration;
using Microsoft.Extensions.Configuration;

namespace AdminWebsite.Services
{
    public interface IUserAccountService
    {
        NewAdUserAccount CreateUser(User newUser);
        NewAdUserAccount CreateUser(string firstName, string lastName, string displayName = null, string password = null);
        void AddUserToGroup(User user, Group group);
        void UpdateAuthenticationInformation(string userId, string recoveryMail);
        /// <summary>
        /// Get a user in AD either via Object ID or UserPrincipalName
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        User GetUserById(string userId);
        IList<User> QueryUsers(string filter);
        User GetUserByAlternativeEmail(string alternativeEmail);
        Group GetGroupByName(string groupName);
        Group GetGroupById(string groupId);
        List<Group> GetGroupsForUser(string userId);
        void ResetPassword(string userId, string password = null);
        IEnumerable<ParticipantDetailsResponse> GetUsersByGroup();
        string TemporaryPassword { get; }
        ParticipantRequest GetAdministrator();
    }

    public class UserAccountService : IUserAccountService
    {
        private readonly TimeSpan _retryTimeout;
        private readonly ITokenProvider _tokenProvider;
        private readonly SecuritySettings _securitySettings;
        private readonly bool _isLive;
        private readonly string _temporaryPassword;
        private readonly AppConfigSettings _appConfigSettings;

        string IUserAccountService.TemporaryPassword => _temporaryPassword;

        public UserAccountService(ITokenProvider tokenProvider, IOptions<SecuritySettings> securitySettings, IOptions<AppConfigSettings> appSettings)
        {
            _retryTimeout = TimeSpan.FromSeconds(appSettings.Value.APIFailureRetryTimeoutSeconds);
            _tokenProvider = tokenProvider;
            _securitySettings = securitySettings.Value;
            _isLive = appSettings.Value.IsLive;
            _temporaryPassword = _securitySettings.TemporaryPassword;
            _appConfigSettings = appSettings.Value;
        }

        public NewAdUserAccount CreateUser(User newUser)
        {
            var accessToken = _tokenProvider.GetClientAccessToken(_securitySettings.ClientId,
                _securitySettings.ClientSecret,
                _securitySettings.GraphApiBaseUri);

            HttpResponseMessage responseMessage;
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var stringContent = new StringContent(JsonConvert.SerializeObject(newUser));
                stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/json");
                var httpRequestMessage =
                    new HttpRequestMessage(HttpMethod.Post, $"{_securitySettings.GraphApiBaseUri}v1.0/users");
                httpRequestMessage.Content = stringContent;
                responseMessage = client.SendAsync(httpRequestMessage).Result;
            }

            if (responseMessage.IsSuccessStatusCode)
            {
                var user = responseMessage.Content.ReadAsAsync<User>().Result;
                var adUserAccount = new NewAdUserAccount
                {
                    Username = user.UserPrincipalName,
                    OneTimePassword = newUser.PasswordProfile.Password,
                    UserId = user.Id
                };
                return adUserAccount;
            }

            var message = $"Failed to add create user {newUser.UserPrincipalName}";
            var reason = responseMessage.Content.ReadAsStringAsync().Result;
            throw new UserServiceException(message, reason);
        }

        /// <summary>
        ///     Creates a user in AD.
        /// </summary>
        /// <param name="firstName"></param>
        /// <param name="lastName"></param>
        /// <param name="displayName"></param>
        /// <param name="password"></param>
        /// <returns></returns>
        public NewAdUserAccount CreateUser(string firstName, string lastName, string displayName = null,
            string password = null)
        {
            string createdPassword = _temporaryPassword;
            var userDisplayName = displayName ?? $@"{firstName} {lastName}";
            var userPrincipalName = $@"{firstName}.{lastName}@hearings.reform.hmcts.net".ToLower();

            var user = new User
            {
                AccountEnabled = true,
                DisplayName = userDisplayName,
                MailNickname = $@"{firstName}.{lastName}",
                PasswordProfile = new PasswordProfile
                {
                    ForceChangePasswordNextSignIn = true,
                    Password = createdPassword
                },
                GivenName = firstName,
                Surname = lastName,
                UserPrincipalName = userPrincipalName
            };

            return CreateUser(user);
        }

        public void AddUserToGroup(User user, Group group)
        {
            var accessToken = _tokenProvider.GetClientAccessToken(_securitySettings.ClientId, _securitySettings.ClientSecret,
                _securitySettings.GraphApiBaseUri);

            var body = new CustomDirectoryObject
            {
                ObjectDataId = $"{_securitySettings.GraphApiBaseUri}v1.0/directoryObjects/{user.Id}"
            };

            HttpResponseMessage responseMessage;
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var stringContent = new StringContent(JsonConvert.SerializeObject(body));
                stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/json");
                var httpRequestMessage =
                    new HttpRequestMessage(HttpMethod.Post,
                        $@"{_securitySettings.GraphApiBaseUri}beta/groups/{group.Id}/members/$ref")
                    {
                        Content = stringContent
                    };
                responseMessage = client.SendAsync(httpRequestMessage).Result;
            }

            if (responseMessage.IsSuccessStatusCode) return;

            var message = $"Failed to add user {user.Id} to group {group.Id}";
            var reason = responseMessage.Content.ReadAsStringAsync().Result;
            throw new UserServiceException(message, reason);
        }

        public void UpdateAuthenticationInformation(string userId, string recoveryMail) {
            var timeout = DateTime.Now.Add(_retryTimeout);
            UpdateAuthenticationInformation(userId, recoveryMail, timeout);
        }

        private void UpdateAuthenticationInformation(string userId, string recoveryMail, DateTime timeout)
        {
            var accessToken = _tokenProvider.GetClientAccessToken(_securitySettings.ClientId,
                _securitySettings.ClientSecret, "https://graph.windows.net/");

            var model = new UpdateAuthenticationInformationRequest
            {
                OtherMails = new List<string> { recoveryMail }
            };

            HttpResponseMessage responseMessage;
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var stringContent = new StringContent(JsonConvert.SerializeObject(model));
                stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/json");
                var httpRequestMessage =
                    new HttpRequestMessage(HttpMethod.Patch,
                        $"https://graph.windows.net/{_securitySettings.TenantId}/users/{userId}?api-version=1.6")
                    {
                        Content = stringContent
                    };
                responseMessage = client.SendAsync(httpRequestMessage).Result;
            }

            if (responseMessage.IsSuccessStatusCode) return;

            var reason = responseMessage.Content.ReadAsStringAsync().Result;

            // If it's 404 try it again as the user might simply not have become "ready" in AD
            if (responseMessage.StatusCode == HttpStatusCode.NotFound) {
                if (DateTime.Now > timeout) {
                    throw new UserServiceException("Timed out trying to update alternative address for ${userId}", reason);
                }
                ApplicationLogger.Trace("APIFailure", "GraphAPI 404 PATCH /users/{id}", $"Failed to update authentication information for user {userId}, will retry.");
                UpdateAuthenticationInformation(userId, recoveryMail, timeout);
                return;
            }

            var message = $"Failed to update alternative email address for {userId}";
            throw new UserServiceException(message, reason);
        }

        public User GetUserById(string userId)
        {
            var accessToken = _tokenProvider.GetClientAccessToken(_securitySettings.ClientId,
                _securitySettings.ClientSecret,
                _securitySettings.GraphApiBaseUri);

            HttpResponseMessage responseMessage;
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                var httpRequestMessage =
                    new HttpRequestMessage(HttpMethod.Get, $"{_securitySettings.GraphApiBaseUri}v1.0/users/{userId}");
                responseMessage = client.SendAsync(httpRequestMessage).Result;
            }

            if (responseMessage.IsSuccessStatusCode)
            {
                return responseMessage.Content.ReadAsAsync<User>().Result;
            }

            if (responseMessage.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }

            var message = $"Failed to get user by id {userId}";
            var reason = responseMessage.Content.ReadAsStringAsync().Result;
            throw new UserServiceException(message, reason);
        }

        public IList<User> QueryUsers(string filter)
        {
            var accessToken = _tokenProvider.GetClientAccessToken(_securitySettings.ClientId,
                _securitySettings.ClientSecret,
                _securitySettings.GraphApiBaseUri);

            HttpResponseMessage responseMessage;
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                var httpRequestMessage =
                    new HttpRequestMessage(HttpMethod.Get, $"{_securitySettings.GraphApiBaseUri}v1.0/users?$filter={filter}");
                responseMessage = client.SendAsync(httpRequestMessage).Result;

            }

            if (responseMessage.IsSuccessStatusCode)
            {
                return responseMessage.Content.ReadAsAsync<AzureAdGraphQueryResponse<User>>().Result.Value;
            }

            var message = $"Failed to get query users with filter {filter}";
            var reason = responseMessage.Content.ReadAsStringAsync().Result;
            throw new UserServiceException(message, reason);
        }

        public User GetUserByAlternativeEmail(string alternativeEmail)
        {
            var accessToken = _tokenProvider.GetClientAccessToken(_securitySettings.ClientId,
                _securitySettings.ClientSecret, "https://graph.windows.net/");

            HttpResponseMessage responseMessage;
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var httpRequestMessage =
                    new HttpRequestMessage(HttpMethod.Get,
                        $"https://graph.windows.net/{_securitySettings.TenantId}/users?$filter=otherMails/any(c:c eq '{alternativeEmail}')&api-version=1.6");
                responseMessage = client.SendAsync(httpRequestMessage).Result;
            }

            if (responseMessage.IsSuccessStatusCode)
            {
                var queryResponse = responseMessage.Content.ReadAsAsync<AzureAdGraphQueryResponse<AzureAdGraphUserResponse>>().Result;
                if (!queryResponse.Value.Any())
                {
                    return null;
                }

                var adUser = queryResponse.Value.First();
                return new User
                {
                    Id = adUser.ObjectId,
                    DisplayName = adUser.DisplayName,
                    UserPrincipalName = adUser.UserPrincipalName
                };
            }

            var message = $"Failed to search for a user with alternate email {alternativeEmail}";
            var reason = responseMessage.Content.ReadAsStringAsync().Result;
            throw new UserServiceException(message, reason);
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

        public List<Group> GetGroupsForUser(string userId)
        {
            var accessToken = _tokenProvider.GetClientAccessToken(_securitySettings.ClientId,
                _securitySettings.ClientSecret, _securitySettings.GraphApiBaseUri);

            HttpResponseMessage responseMessage;
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                var httpRequestMessage = new HttpRequestMessage(HttpMethod.Get,
                    $"{_securitySettings.GraphApiBaseUri}v1.0/users/{userId}/memberOf");
                responseMessage = client.SendAsync(httpRequestMessage).Result;
            }

            if (responseMessage.IsSuccessStatusCode)
            {
                var queryResponse = responseMessage.Content.ReadAsAsync<DirectoryObject>().Result;
                var groups =
                    JsonConvert.DeserializeObject<List<Group>>(queryResponse.AdditionalData["value"].ToString());
                return groups;
            }

            var message = $"Failed to get group for user {userId}";
            var reason = responseMessage.Content.ReadAsStringAsync().Result;
            throw new UserServiceException(message, reason);
        }

        public void ResetPassword(string userId, string password = null)
        {
            var accessToken = _tokenProvider.GetClientAccessToken(_securitySettings.ClientId,
                _securitySettings.ClientSecret, _securitySettings.GraphApiBaseUri);

            var createdPassword = password ?? new PasswordGenerator().IncludeLowercase().IncludeUppercase()
                                      .IncludeNumeric().IncludeSpecial().LengthRequired(8).Next();

            var model = new User
            {
                PasswordProfile = new PasswordProfile
                {
                    Password = createdPassword,
                    ForceChangePasswordNextSignIn = true
                }
            };

            HttpResponseMessage responseMessage;
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var stringContent = new StringContent(JsonConvert.SerializeObject(model));
                stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/json");
                var httpRequestMessage =
                    new HttpRequestMessage(HttpMethod.Patch, $"{_securitySettings.GraphApiBaseUri}v1.0/users/{userId}")
                    {
                        Content = stringContent
                    };
                responseMessage = client.SendAsync(httpRequestMessage).Result;
            }

            if (responseMessage.IsSuccessStatusCode) return;
            var message = $"Failed to get group for user {userId}";
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

        public ParticipantRequest GetAdministrator()
        {
            ParticipantRequest participantRequest = new ParticipantRequest()
            {
                Display_name = _appConfigSettings.ParticipantRequest.Display_name,
                Email = _appConfigSettings.ParticipantRequest.Email,
                External_flag = false,
                External_id = null,
                First_name = _appConfigSettings.ParticipantRequest.First_name,
                Last_name = _appConfigSettings.ParticipantRequest.Last_name,
                Middle_names = "",
                Mobile = "",
                Organisation_address = null,
                Organisation_name = null,
                Phone = _appConfigSettings.ParticipantRequest.Phone,
                Representing = null,
                Role = _appConfigSettings.ParticipantRequest.Role,
                Title = _appConfigSettings.ParticipantRequest.Title,
                Username = _appConfigSettings.ParticipantRequest.Username,
            };
            return participantRequest;
        }
    }
}
