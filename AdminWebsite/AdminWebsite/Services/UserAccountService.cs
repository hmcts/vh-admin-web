using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Extensions;
using Microsoft.Extensions.Logging;
using UserApi.Client;
using UserApi.Contract.Requests;
using UserApi.Contract.Responses;

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
        Task<IEnumerable<JudgeResponse>> GetJudgeUsers();
        /// <summary>
        /// Creates a user based on the participant information or updates the participant username if it already exists
        /// </summary>
        /// <param name="participant"></param>
        /// <returns></returns>
        Task<User> UpdateParticipantUsername(ParticipantRequest participant);

        Task<UserRole> GetUserRoleAsync(string userName);

        /// <summary>
        ///     Updates the users AAD password
        /// </summary>
        /// <param name="userName"></param>
        /// <returns></returns>
        Task<UpdateUserPasswordResponse> UpdateParticipantPassword(string userName);

        /// <summary>
        /// Delete a user account in AD, then anonymise the person in Bookings API
        /// </summary>
        /// <param name="username"></param>
        /// <returns></returns>
        Task DeleteParticipantAccountAsync(string username);

        Task AssignParticipantToGroup(string username, string userRole);

        Task<string> GetAdUserIdForUsername(string username);
    }

    public class UserAccountService : IUserAccountService
    {
        public const string RepresentativeRole = "Representative";
        public const string JohRole = "Judicial Office Holder";
        public const string External = "External";
        public const string VirtualRoomProfessionalUser = "VirtualRoomProfessionalUser";
        public const string JudicialOfficeHolder = "JudicialOfficeHolder";

        private readonly IUserApiClient _userApiClient;
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly ILogger<UserAccountService> _logger;

        /// <summary>
        /// User account management service
        /// </summary>
        /// <param name="userApiClient"></param>
        /// <param name="bookingsApiClient"></param>
        /// <param name="logger"></param>
        public UserAccountService(IUserApiClient userApiClient, IBookingsApiClient bookingsApiClient, ILogger<UserAccountService> logger)
        {
            _userApiClient = userApiClient;
            _bookingsApiClient = bookingsApiClient;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<User> UpdateParticipantUsername(ParticipantRequest participant)
        {
            // create user in AD if users email does not exist in AD.
            _logger.LogDebug("Checking for username with contact email {contactEmail}.", participant.Contact_email);
            var userProfile = await GetUserByContactEmail(participant.Contact_email);
            if (userProfile == null)
            {
                _logger.LogDebug("User with contact email {contactEmail} does not exist. Creating an account.", participant.Contact_email);
                // create the user in AD.
                var newUser = await CreateNewUserInAD(participant);
                return new User() 
                            {  
                                UserName = newUser.UserId,
                                Password = newUser.OneTimePassword
                            };
            }

            participant.Username = userProfile.UserName;
            return new User() { 
                UserName = userProfile.UserId 
            };
        }

        public async Task<UserRole> GetUserRoleAsync(string userName)
        {
            var user = await _userApiClient.GetUserByAdUserNameAsync(userName);
            Enum.TryParse<UserRoleType>(user.UserRole, out var userRoleResult);

            return new UserRole { UserRoleType = userRoleResult, CaseTypes = user.CaseType };
        }

        private async Task<UserProfile> GetUserByContactEmail(string emailAddress)
        {
            _logger.LogDebug("Attempt to get username by contact email {contactEmail}.", emailAddress);
            try
            {
                var user = await _userApiClient.GetUserByEmailAsync(emailAddress);
                _logger.LogDebug("User with contact email {contactEmail} found.", emailAddress);
                return user;
            }
            catch (UserApiException e)
            {
                if (e.StatusCode == (int) HttpStatusCode.NotFound)
                {
                    _logger.LogWarning("User with contact email {contactEmail} not found.", emailAddress);
                    return null;
                }

                _logger.LogError(e, "Unhandled error getting a user with contact email {contactEmail}.", emailAddress);
                throw;
            }
        }

        public async Task<string> GetAdUserIdForUsername(string username)
        {
            try
            {
                _logger.LogDebug($"{nameof(GetAdUserIdForUsername)} - Attempting to get an AD user with username {username} found.", username);
                var user = await _userApiClient.GetUserByAdUserIdAsync(username);
                _logger.LogDebug($"{nameof(GetAdUserIdForUsername)} - AD User with username {username} found.", username);

                if(user.HasValidUserRole())
                {
                    _logger.LogWarning($"{nameof(GetAdUserIdForUsername)} - AD user with username {username} does not have a user role.");
                }
                
                return user.UserId;
            }
            catch (UserApiException e)
            {
                if (e.StatusCode == (int) HttpStatusCode.NotFound)
                {
                    _logger.LogWarning($"{nameof(GetAdUserIdForUsername)} - AD User with username {username} not found.", username);
                    return null;
                }
                _logger.LogError(e, $"{nameof(GetAdUserIdForUsername)} - Unhandled error getting an AD user with username {username}.", username);
                throw;
            }
        }

        private async Task<NewUserResponse> CreateNewUserInAD(ParticipantRequest participant)
        {
            const string BLANK = " ";
            _logger.LogDebug("Attempting to create an AD user with contact email {contactEmail}.", participant.Contact_email);
            var createUserRequest = new CreateUserRequest
            {
                FirstName = participant.First_name?.Replace(BLANK, string.Empty),
                LastName = participant.Last_name?.Replace(BLANK, string.Empty),
                RecoveryEmail = participant.Contact_email,
                IsTestUser = false
            };

            var newUserResponse = await _userApiClient.CreateUserAsync(createUserRequest);
            _logger.LogDebug("Successfully created an AD user with contact email {contactEmail}.", participant.Contact_email);
            participant.Username = newUserResponse.Username;
            return newUserResponse;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<JudgeResponse>> GetJudgeUsers()
        {
            _logger.LogDebug("Attempting to get all judge accounts.");
            var judgesList = await _userApiClient.GetJudgesAsync();
            return judgesList.Select(x => new JudgeResponse
            {
                FirstName = x.FirstName,
                LastName = x.LastName,
                DisplayName = x.DisplayName,
                Email = x.Email
            }).ToList();
        }

        public async Task<UpdateUserPasswordResponse> UpdateParticipantPassword(string userName)
        {
            _logger.LogDebug("Attempting to reset AD user {username}.", userName);
            var userProfile = await _userApiClient.GetUserByAdUserNameAsync(userName);
            
            if (userProfile != null)
            {
                _logger.LogWarning("AD user {username} found.", userName);
                var response = await _userApiClient.ResetUserPasswordAsync(userName);
                _logger.LogWarning("AD user {username} password has been reset.", userName);
                return new UpdateUserPasswordResponse
                {
                    Password = response.NewPassword
                };
            }

            var e = new Security.UserServiceException
            {
                Reason = "Unable to generate new password"
            };
            _logger.LogError(e, "Unable to reset password for AD user {username}.", userName);
            throw e;
        }

        public async Task DeleteParticipantAccountAsync(string username)
        {
            if (await CheckUsernameExistsInAdAsync(username))
            {
                _logger.LogDebug("Attempting to delete AD User {username}.", username);
                await _userApiClient.DeleteUserAsync(username);
                _logger.LogDebug("Successfully deleted AD User {username}.", username);
            }

            if (await CheckPersonExistsInBookingsAsync(username))
            {
                _logger.LogDebug("Attempting to anonymise person in Bookings API {username}.", username);
                await _bookingsApiClient.AnonymisePersonWithUsernameAsync(username);
                _logger.LogDebug("Successfully anonymised person in Bookings API {username}.", username);
            }
        }

        public async Task AssignParticipantToGroup(string username, string userRole)
        {
            await AddGroup(username, External);
            
            switch (userRole)
            {
                case RepresentativeRole:
                    await AddGroup(username, VirtualRoomProfessionalUser);
                    break;
                case JohRole:
                    await AddGroup(username, JudicialOfficeHolder);
                    break;
            }
        }

        private async Task AddGroup(string username, string groupName)
        {
            var addUserToGroupRequest = new AddUserToGroupRequest
            {
                UserId = username,
                GroupName = groupName
            };

            await _userApiClient.AddUserToGroupAsync(addUserToGroupRequest);
            _logger.LogDebug("{username} to group {group}.", username, addUserToGroupRequest.GroupName);
        }

        private async Task<bool> CheckUsernameExistsInAdAsync(string username)
        {
            try
            {
                _logger.LogDebug("Attempting to check if {username} exists in AD", username);
                var person = await _userApiClient.GetUserByAdUserNameAsync(username);
                Enum.TryParse<UserRoleType>(person.UserRole, out var userRoleResult);
                if (userRoleResult == UserRoleType.Judge || userRoleResult == UserRoleType.VhOfficer)
                {
                    var e = new Security.UserServiceException()
                    {
                        Reason = $"Unable to delete account with role {userRoleResult}"
                    };
                    _logger.LogError(e, "Not allowed to delete {username}", username);
                    throw e;
                }

                _logger.LogDebug("{username} exists in AD", username);
                return true;
            }
            catch (UserApiException e)
            {
                _logger.LogError(e, "Failed to get user {username} in User API. Status Code {StatusCode} - Message {Message}",
                    username, e.StatusCode, e.Response);
                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    _logger.LogWarning(e, "{username} not found. Status Code {StatusCode} - Message {Message}",
                        username, e.StatusCode, e.Response);
                    return false;
                }

                throw;
            }
        }
        
        private async Task<bool> CheckPersonExistsInBookingsAsync(string username)
        {
            try
            {
                _logger.LogDebug("Attempting to check if {username} exists in Bookings API", username);
                await _bookingsApiClient.GetHearingsByUsernameForDeletionAsync(username);
                _logger.LogDebug("{username} exists in Bookings API", username);
                return true;
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e, "Failed to get person {username} in User API. Status Code {StatusCode} - Message {Message}",
                    username, e.StatusCode, e.Response);
                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    _logger.LogWarning(e, "{username} not found. Status Code {StatusCode} - Message {Message}",
                        username, e.StatusCode, e.Response);
                    return false;
                }

                throw;
            }
        }
    }
}
