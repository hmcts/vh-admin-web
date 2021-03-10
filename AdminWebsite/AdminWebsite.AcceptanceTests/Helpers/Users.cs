using System.Collections.Generic;
using System.Data;
using System.Linq;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public static class Users
    {
        public static UserDto GetDefaultParticipantUser(List<UserDto> users)
        {
            return users.FirstOrDefault(x => x.UserType == UserType.Individual);
        }

        public static UserDto GetJudgeUser(List<UserDto> users)
        {
            return users.FirstOrDefault(x => x.UserType == UserType.Judge);
        }

        public static UserDto GetIndividualUser(List<UserDto> users)
        {
            return users.FirstOrDefault(x => x.UserType == UserType.Individual);
        }

        public static UserDto GetRepresentativeUser(List<UserDto> users)
        {
            return users.FirstOrDefault(x => x.UserType == UserType.Representative);
        }

        public static UserDto GetPanelMemberUser(List<UserDto> users)
        {
            return users.FirstOrDefault(x => x.UserType == UserType.PanelMember);
        }

        public static UserDto GetWingerUser(List<UserDto> users)
        {
            return users.FirstOrDefault(x => x.UserType == UserType.Winger);
        }

        public static UserDto GetUserFromDisplayName(List<UserDto> users, string displayName)
        {
            return users.FirstOrDefault(x => x.DisplayName.ToLower().Contains(displayName.ToLower().Replace(" ", "")));
        }

        public static UserDto GetUser(List<UserDto> users, string numberString, string user)
        {
            var number = GetNumberFromWords(numberString);

            if (user.ToLowerInvariant().Contains("judge"))
            {
                return users.First(x => x.UserType == UserType.Judge);
            }

            if (user.ToLowerInvariant().Contains("individual"))
            {
                return GetAllUsersOfType(users, UserType.Individual)[number];
            }

            if (user.ToLowerInvariant().Contains("representative"))
            {
                return GetAllUsersOfType(users, UserType.Representative)[number];
            }

            if (user.ToLowerInvariant().Contains("panel member") ||
                user.ToLowerInvariant().Contains("panelmember"))
            {
                return GetAllUsersOfType(users, UserType.PanelMember)[number];
            }

            if (user.ToLowerInvariant().Contains("observer"))
            {
                return GetAllUsersOfType(users, UserType.Observer)[number];
            }

            if (user.ToLowerInvariant().Contains("video hearings officer") ||
                user.ToLowerInvariant().Contains("videohearingsofficer"))
            {
                return users.First(x => x.UserType == UserType.VideoHearingsOfficer);
            }

            throw new DataException($"No matching user could be found from '{user}'");
        }

        private static int GetNumberFromWords(string text)
        {
            var numberTable = new Dictionary<string, int>
            {
                {"one",1},
                {"two",2},
                {"three",3},
                {"four",4},
                {"five",5}
            };
            return numberTable[text];
        }

        private static List<UserDto> GetAllUsersOfType(List<UserDto> users, UserType userType)
        {
            return users.FindAll(x => x.UserType == userType);
        }
    }
}
