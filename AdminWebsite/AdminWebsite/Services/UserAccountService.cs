﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Extensions.Logging;
using AdminWebsite.Security;
using BookingsApi.Client;
using Microsoft.Extensions.Logging;
using NotificationApi.Client;
using NotificationApi.Contract.Requests;
using UserApi.Client;
using UserApi.Contract.Requests;
using UserApi.Contract.Responses;

namespace AdminWebsite.Services
{
    public interface IUserAccountService
    {
        /// <summary>
        ///     Returns a list of judges filtered by email in the active directory
        /// </summary>
        /// <remarks>
        /// Filters test accounts if configured to run as live environment 
        /// </remarks>
        Task<IEnumerable<JudgeResponse>> SearchJudgesByEmail(string term);

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
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly ILogger<UserAccountService> _logger;
        private readonly INotificationApiClient _notificationApiClient;

        private readonly IUserApiClient _userApiClient;

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

        public async Task<string> GetAdUserIdForUsername(string username)
        {
            try
            {
                var user = await _userApiClient.GetUserByAdUserIdAsync(username);
                return user.UserId;
            }
            catch (UserApiException e)
            {
                if (e.StatusCode != (int)HttpStatusCode.NotFound)
                {
                    _logger.LogUnhandledErrorGettingAdUser(username, e);
                    throw;
                }
                _logger.LogAdUserNotFound(username);
                return null;
            }
        }

        public async Task<IEnumerable<JudgeResponse>> SearchJudgesByEmail(string term)
        {
            _logger.LogAttemptingToGetAllJudgeAccounts();

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

        public async Task ResetParticipantPassword(string userName)
        {
            var userProfile = await _userApiClient.GetUserByAdUserNameAsync(userName);

            if (userProfile == null)
                throw new UserServiceException { Reason = "Unable to generate new password" };
            
            var passwordResetResponse = await _userApiClient.ResetUserPasswordAsync(userName);
            await _notificationApiClient.SendResetPasswordEmailAsync(new PasswordResetEmailRequest()
            {
                ContactEmail = userProfile.Email,
                Password = passwordResetResponse.NewPassword,
                Name = $"{userProfile.FirstName} {userProfile.LastName}"
            });
        }

        public async Task DeleteParticipantAccountAsync(string username)
        {
            if (await CheckUsernameExistsInAdAsync(username))
                await _userApiClient.DeleteUserAsync(username);
            
            if (await CheckPersonExistsInBookingsAsync(username))
                await _bookingsApiClient.AnonymisePersonWithUsernameAsync(username);
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

        private async Task<bool> CheckUsernameExistsInAdAsync(string username)
        {
            try
            {
                var person = await _userApiClient.GetUserByAdUserNameAsync(username);
                if (!Enum.TryParse<UserRoleType>(person.UserRole, out var userRoleResult))
                {
                    throw new InvalidOperationException($"Invalid user role: {person.UserRole}");
                }
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
                _logger.LogFailedToGetUserInUserApi(e.StatusCode, e.Response, e);
                if (e.StatusCode != (int)HttpStatusCode.NotFound) throw;
                _logger.LogUserNotFoundInUserApi(e.StatusCode, e.Response);
                return false;
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
                _logger.LogFailedToGetPersonInUserApi(e.StatusCode, e.Response, e);
                if (e.StatusCode != (int)HttpStatusCode.NotFound) throw;
                _logger.LogUserNotFoundInUserApi(e.StatusCode, e.Response);
                return false;
            }
        }
    }
}
