using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers;
using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using BookingsApi.Client;
using Microsoft.Extensions.Logging;
using NotificationApi.Client;
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
        ///     Returns a list of judges filtered by email in the active directory
        /// </summary>
        /// <remarks>
        /// Filters test accounts if configured to run as live environment 
        /// </remarks>
        Task<IEnumerable<JudgeResponse>> SearchJudgesByEmail(string term);

        /// <summary>
        ///     Returns a list of judges filtered by email in the active directory
        /// </summary>
        /// <remarks>
        /// Filters test accounts if configured to run as live environment 
        /// </remarks>
        Task<IEnumerable<UserResponse>> SearchEjudiciaryJudgesByEmailUserResponse(string term);

        Task<UserRole> GetUserRoleAsync(string userName);

        /// <summary>
        ///     Updates the users AAD password
        /// </summary>
        /// <param name="userName"></param>
        /// <returns></returns>
        Task ResetParticipantPassword(string userName);

        /// <summary>
        /// Delete a user account in AD, then anonymise the person in Bookings API
        /// </summary>
        /// <param name="username"></param>
        /// <returns></returns>
        Task DeleteParticipantAccountAsync(string username);

        Task AssignParticipantToGroup(string username, string userRole);

        Task<string> GetAdUserIdForUsername(string username);

        Task<UserResponse> UpdateUserAccountDetails(Guid userId, string firstName, string lastName);
    }

    public class UserAccountService : IUserAccountService
    {
        public const string RepresentativeRole = "Representative";
        public const string JohRole = "Judicial Office Holder";
        public const string External = "External";
        public const string Internal = "Internal";
        public const string VirtualRoomProfessionalUser = "VirtualRoomProfessionalUser";
        public const string JudicialOfficeHolder = "JudicialOfficeHolder";
        public const string StaffMember = "Staff Member";

        private readonly IUserApiClient _userApiClient;
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly INotificationApiClient _notificationApiClient;
        private readonly ILogger<UserAccountService> _logger;

        /// <summary>
        /// User account management service
        /// </summary>
        /// <param name="userApiClient"></param>
        /// <param name="bookingsApiClient"></param>
        /// <param name="notificationApiClient"></param>
        /// <param name="logger"></param>
        public UserAccountService(
            IUserApiClient userApiClient, 
            IBookingsApiClient bookingsApiClient, 
            INotificationApiClient notificationApiClient, 
            ILogger<UserAccountService> logger)
        {
            _userApiClient = userApiClient;
            _bookingsApiClient = bookingsApiClient;
            _logger = logger;
            _notificationApiClient = notificationApiClient;
        }

        public async Task<UserRole> GetUserRoleAsync(string userName)
        {
            var user = await _userApiClient.GetUserByAdUserNameAsync(userName);
            Enum.TryParse<UserRoleType>(user.UserRole, out var userRoleResult);

            return new UserRole { UserRoleType = userRoleResult, CaseTypes = user.CaseType };
        }

        public async Task<string> GetAdUserIdForUsername(string username)
        {
            try
            {
                var user = await _userApiClient.GetUserByAdUserIdAsync(username);
                return user.UserId;
            }
            catch (UserApiException e)
            {
                if (e.StatusCode == (int) HttpStatusCode.NotFound)
                {
                    _logger.LogWarning($"{nameof(GetAdUserIdForUsername)} - AD User not found.");
                    return null;
                }
                _logger.LogError(e, $"{nameof(GetAdUserIdForUsername)} - Unhandled error getting an AD user");
                throw;
            }
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
                Email = x.Email,
                ContactEmail = x.ContactEmail
            }).ToList();
        }

        public async Task<IEnumerable<JudgeResponse>> SearchJudgesByEmail(string term)
        {
            _logger.LogDebug("Attempting to get all judge accounts.");

            var judgesList = (await _userApiClient.GetJudgesByUsernameAsync(term)).Select(x => new JudgeResponse
            {
                FirstName = x.FirstName,
                LastName = x.LastName,
                DisplayName = x.DisplayName,
                Email = x.Email,
                ContactEmail = x.ContactEmail
            }).ToList();

            return judgesList;
        }

        public async Task<IEnumerable<UserResponse>> SearchEjudiciaryJudgesByEmailUserResponse(string term)
        {
            _logger.LogDebug("Attempting to get all judge accounts.");
            var judgesList = await _userApiClient.GetEjudiciaryJudgesByUsernameAsync(term);
            return judgesList;
        }

        public async Task ResetParticipantPassword(string userName)
        {
            var userProfile = await _userApiClient.GetUserByAdUserNameAsync(userName);

            if (userProfile == null)
                throw new UserServiceException { Reason = "Unable to generate new password" };
            
            var passwordResetResponse = await _userApiClient.ResetUserPasswordAsync(userName);
            var passwordResetNotificationRequest = 
                AddNotificationRequestMapper.MapToPasswordResetNotification(
                    $"{userProfile.FirstName} {userProfile.LastName}", 
                    passwordResetResponse.NewPassword, 
                    userProfile.Email);
            await _notificationApiClient.CreateNewNotificationAsync(passwordResetNotificationRequest);
        }

        public async Task DeleteParticipantAccountAsync(string username)
        {
            if (await CheckUsernameExistsInAdAsync(username))
                await _userApiClient.DeleteUserAsync(username);
            
            if (await CheckPersonExistsInBookingsAsync(username))
                await _bookingsApiClient.AnonymisePersonWithUsernameAsync(username);
        }

        public async Task AssignParticipantToGroup(string username, string userRole)
        {   
            switch (userRole)
            {
                case RepresentativeRole:
                    await AddGroup(username, External);
                    await AddGroup(username, VirtualRoomProfessionalUser);
                    break;
                case JohRole:
                    await AddGroup(username, External);
                    await AddGroup(username, JudicialOfficeHolder);
                    break;
                case StaffMember:
                    await AddGroup(username, Internal);
                    await AddGroup(username, StaffMember);
                    break;
                default:
                    await AddGroup(username, External);
                    break;
            }
        }

        /// <summary>
        /// Update an existing account
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="firstName"></param>
        /// <param name="lastName"></param>
        /// <returns>Updated user details</returns>
        /// <exception cref="UserApiException"></exception>
        public Task<UserResponse> UpdateUserAccountDetails(Guid userId, string firstName, string lastName)
        {
            var request = new UpdateUserAccountRequest
            {
                FirstName = firstName,
                LastName = lastName
            };
            return _userApiClient.UpdateUserAccountAsync(userId, request);
        }

        private async Task AddGroup(string username, string groupName)
        {
            try
            {
                var addUserToGroupRequest = new AddUserToGroupRequest
                {
                    UserId = username,
                    GroupName = groupName
                };
                await _userApiClient.AddUserToGroupAsync(addUserToGroupRequest);
            }
            catch (UserApiException e)
            {
                _logger.LogError(e, $"Failed to add user to {groupName} in User API. " +
                    $"Status Code {e.StatusCode} - Message {e.Message}");
                throw;
            }
        }

        private async Task<bool> CheckUsernameExistsInAdAsync(string username)
        {
            try
            {
                var person = await _userApiClient.GetUserByAdUserNameAsync(username);
                Enum.TryParse<UserRoleType>(person.UserRole, out var userRoleResult);
                if (userRoleResult == UserRoleType.Judge || userRoleResult == UserRoleType.VhOfficer)
                {
                    var e = new UserServiceException
                    {
                        Reason = $"Unable to delete account with role {userRoleResult}"
                    };
                    _logger.LogError(e, "Not allowed to delete user");
                    throw e;
                }
                return true;
            }
            catch (UserApiException e)
            {
                _logger.LogError(e, "Failed to get user in User API. Status Code {StatusCode} - Message {Message}",e.StatusCode, e.Response);
                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    _logger.LogWarning(e, "User not found. Status Code {StatusCode} - Message {Message}",e.StatusCode, e.Response);
                    return false;
                }
                throw;
            }
        }
        
        private async Task<bool> CheckPersonExistsInBookingsAsync(string username)
        {
            try
            {
                await _bookingsApiClient.GetHearingsByUsernameForDeletionAsync(username);
                return true;
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e, "Failed to get person in User API. Status Code {StatusCode} - Message {Message}",e.StatusCode, e.Response);
                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    _logger.LogWarning(e, "User not found. Status Code {StatusCode} - Message {Message}", e.StatusCode, e.Response);
                    return false;
                }
                throw;
            }
        }
    }
}
