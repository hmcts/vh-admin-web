using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Helper;
using AdminWebsite.Security;
using Microsoft.Extensions.Options;
using Microsoft.Graph;

namespace AdminWebsite.Services
{
    public class UserManager
    {
        private readonly IUserAccountService _userAccountService;
        private readonly string _temporaryPassword;

        public UserManager(IUserAccountService userAccountService)
        {
            _userAccountService = userAccountService;
            _temporaryPassword = _userAccountService.TemporaryPassword;
        }

        /// <summary>
        /// Create a user account in AD and assign the roles and set the recovery information.
        /// </summary>
        /// <param name="firstName"></param>
        /// <param name="lastName"></param>
        /// <param name="recoveryEmail"></param>
        /// <param name="role"></param>
        /// <returns>The username</returns>
        public virtual string CreateAdAccount(string firstName, string lastName, string recoveryEmail, string role)
        {
            var userPrincipalName = CheckForNextAvailableUsername(firstName, lastName);

            var user = new User
            {
                AccountEnabled = true,
                DisplayName = $@"{firstName} {lastName}",
                MailNickname = $@"{firstName}.{lastName}",
                PasswordProfile = new PasswordProfile
                {
                    ForceChangePasswordNextSignIn = true,
                    Password = _temporaryPassword
                },
                GivenName = firstName,
                Surname = lastName,
                UserPrincipalName = userPrincipalName
            };

            var adUser = _userAccountService.CreateUser(user);
            _userAccountService.UpdateAuthenticationInformation(adUser.UserId, recoveryEmail);
            AddToGroups(adUser.UserId, role);
            return adUser.Username;
        }

        /// <summary>
        /// This will check Azure AD for a user with the alternate email set to a given email address.
        /// </summary>
        /// <param name="recoveryEmail"></param>
        /// <returns>The username</returns>
        public virtual string GetUsernameForUserWithRecoveryEmail(string recoveryEmail)
        {
            return _userAccountService.GetUserByAlternativeEmail(recoveryEmail)?.UserPrincipalName;
        }

        /// <summary>
        /// Determine the next available username for a participant based on username format [firstname].[lastname]
        /// </summary>
        /// <param name="firstName"></param>
        /// <param name="lastName"></param>
        /// <returns>next available user principal name</returns>
        public virtual string CheckForNextAvailableUsername(string firstName, string lastName)
        {
            var baseUsername = $"{firstName}.{lastName}".ToLower();
            var userFilter = $@"startswith(userPrincipalName,'{baseUsername}')";
            var users = _userAccountService.QueryUsers(userFilter).ToList();
            var domain = "@hearings.reform.hmcts.net";
            if (!users.Any())
            {
                var userPrincipalName = $"{baseUsername}{domain}";
                return userPrincipalName;
            }
            users = users.OrderBy(x => x.UserPrincipalName).ToList();
            var lastUserPrincipalName = users.Last().UserPrincipalName;

            lastUserPrincipalName = GetStringWithoutWord(lastUserPrincipalName, domain);
            lastUserPrincipalName = GetStringWithoutWord(lastUserPrincipalName, baseUsername);


            int.TryParse(lastUserPrincipalName, out var lastNumber);
            lastNumber = 1;

            return $"{baseUsername}{lastNumber}{domain}";
        }

        private string GetStringWithoutWord(string currentWord, string wordToRemove)
        {
            return currentWord.Remove(currentWord.IndexOf(wordToRemove, StringComparison.InvariantCultureIgnoreCase),
                wordToRemove.Length);
        }

        public virtual IEnumerable<string> GetGroupsForRole(string role)
        {
            var roles = new List<string>();
            if (role == "Citizen")
                roles.AddRange(new List<string> {"External", "Participant"});
            else if (role == "Professional")
                roles.AddRange(new List<string> {"External", "VirtualRoomProfessionalUser", "Participant"});
            else if (role == "Judge")
                roles.AddRange(new List<string> {"Internal", "VirtualRoomJudge", "Judge"});
            else if (role == "Administrator")
                roles.AddRange(new List<string> {"Internal", "VirtualRoomHearingAdministrator", "Admin"});
            else if (role == "Clerk") roles.AddRange(new List<string> {"Internal", "VirtualRoomClerk"});

            return roles;
        }

        /// <summary>
        /// Will check the groups for a role. Will then add a user to an AD group if they are not already in it.
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="role"></param>
        public virtual void AddToGroups(string userId, string role)
        {
            var groups = GetGroupsForRole(role);
            var existingGroups = _userAccountService.GetGroupsForUser(userId);
            foreach (var adGroup in groups)
            {
                if (existingGroups.All(g => g.DisplayName != adGroup))
                {
                    AddToGroupsByUserId(userId, adGroup);
                }
            }
        }

        public virtual void AddToGroupsByUsername(string username, string role)
        {
            var user = _userAccountService.GetUserById(username);
            AddToGroups(user.Id, role);
        }

        private void AddToGroupsByUserId(string userId, string groupName)
        {
            var group = _userAccountService.GetGroupByName(groupName);
            if (group == null)
            {
                throw new UserServiceException($"Group {groupName} does not exist", "Invalid group name");
            }
            _userAccountService.AddUserToGroup(new User {Id = userId}, group);
        }

        public FeedRequest AddAdministrator()
        {
            var participantRequest = _userAccountService.GetAdministrator();

            FeedRequest feedRequest = new FeedRequest { Location = "Administrator", Participants = new List<ParticipantRequest>() };
            feedRequest.Participants.Add(participantRequest);
            return feedRequest;
        }
    }
}
