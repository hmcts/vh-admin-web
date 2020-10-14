using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using AdminWebsite.UserAPI.Client;
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
        /// Creates a user based on the participant information or updates the participant username if it already exists
        /// </summary>
        /// <param name="participant"></param>
        /// <returns></returns>
        Task<string> UpdateParticipantUsername(ParticipantRequest participant);

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

        /// <summary>
        /// Create a new user in AD
        /// </summary>
        /// <param name="participant"></param>
        /// <returns>New User response</returns>
        Task<NewUserResponse> CreateNewUserInAD(ParticipantRequest participant);
    }

    public class UserAccountService : IUserAccountService
    {
        public static readonly string External = "External";
        public static readonly string VirtualRoomProfessionalUser = "VirtualRoomProfessionalUser";
        
        private readonly IUserApiClient _userApiClient;
        private readonly IBookingsApiClient _bookingsApiClient;

        /// <summary>
        /// Create the service
        /// </summary>
        /// <param name="userApiClient"></param>
        /// <param name="bookingsApiClient"></param>
        public UserAccountService(IUserApiClient userApiClient, IBookingsApiClient bookingsApiClient)
        {
            _userApiClient = userApiClient;
            _bookingsApiClient = bookingsApiClient;
        }

        /// <inheritdoc />
        public async Task<string> UpdateParticipantUsername(ParticipantRequest participant)
        {
            // create user in AD if users email does not exist in AD.
            var userProfile = await CheckUserExistsInAD(participant.Contact_email);
            if (userProfile == null)
            {
                // create the user in AD.
                var newUser = await CreateNewUserInAD(participant);
                return newUser.User_id;
            }

            participant.Username = userProfile.User_name;
            return userProfile.User_id;
        }

        public async Task<UserRole> GetUserRoleAsync(string userName)
        {
            var user = await _userApiClient.GetUserByAdUserNameAsync(userName);
            Enum.TryParse<UserRoleType>(user.User_role, out var userRoleResult);

            return new UserRole { UserRoleType = userRoleResult, CaseTypes = user.Case_type };
        }

        private async Task<UserProfile> CheckUserExistsInAD(string emailAddress)
        {
            try
            {
                return await _userApiClient.GetUserByEmailAsync(emailAddress);
            }
            catch (UserAPI.Client.UserServiceException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    return null;
                }

                throw;
            }
        }

        public async Task<string> GetAdUserIdForUsername(string username)
        {
            try
            {
                var user = await _userApiClient.GetUserByAdUserIdAsync(username);
                return user.User_id;
            }
            catch (UserAPI.Client.UserServiceException e)
            {
                if (e.StatusCode == (int) HttpStatusCode.NotFound)
                {
                    return null;
                }

                throw;
            }
        }

        public async Task<NewUserResponse> CreateNewUserInAD(ParticipantRequest participant)
        {
            const string BLANK = " ";

            var createUserRequest = new CreateUserRequest
            {
                First_name = participant.First_name?.Replace(BLANK, string.Empty),
                Last_name = participant.Last_name?.Replace(BLANK, string.Empty),
                Recovery_email = participant.Contact_email,
                Is_test_user = false
            };

            var newUserResponse = await _userApiClient.CreateUserAsync(createUserRequest);

            participant.Username = newUserResponse.Username;

           
            
            return newUserResponse;
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

        public async Task<UpdateUserPasswordResponse> UpdateParticipantPassword(string userName)
        {
            var userProfile = await _userApiClient.GetUserByAdUserNameAsync(userName);
            
            if (userProfile != null)
            {
                var response = await _userApiClient.UpdateUserAsync(userName);
                
                return new UpdateUserPasswordResponse
                {
                    Password = response.New_password
                };
            }

            throw new Security.UserServiceException
            {
                Reason = "Unable to generate new password"
            };
        }

        public async Task DeleteParticipantAccountAsync(string username)
        {
            if (await CheckUsernameExistsInAdAsync(username))
            {
               await _userApiClient.DeleteUserAsync(username);
            }
            
            if (await CheckPersonExistsInBookingsAsync(username))
            {
                await _bookingsApiClient.AnonymisePersonWithUsernameAsync(username);
            }
        }

        public async Task AssignParticipantToGroup(string username, string userRole)
        {
            const string REPRESENTATIVE_ROLE = "Representative";
            
            // Add user to user group.
            var addUserToGroupRequest = new AddUserToGroupRequest
            {
                User_id = username,
                Group_name = External
            };

            await _userApiClient.AddUserToGroupAsync(addUserToGroupRequest);
            if (userRole == REPRESENTATIVE_ROLE )
            {
                addUserToGroupRequest = new AddUserToGroupRequest
                {
                    User_id = username,
                    Group_name = VirtualRoomProfessionalUser
                };
                
                await _userApiClient.AddUserToGroupAsync(addUserToGroupRequest);
            }
        }

        private async Task<bool> CheckUsernameExistsInAdAsync(string username)
        {
            try
            {
                var person = await _userApiClient.GetUserByAdUserNameAsync(username);
                Enum.TryParse<UserRoleType>(person.User_role, out var userRoleResult);
                if (userRoleResult == UserRoleType.Judge || userRoleResult == UserRoleType.VhOfficer)
                {
                    throw new Security.UserServiceException()
                    {
                        Reason = $"Unable to delete account with role {userRoleResult}"
                    };
                }
                return true;
            }
            catch (UserAPI.Client.UserServiceException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                {
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
                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    return false;
                }

                throw;
            }
        }
    }
}
