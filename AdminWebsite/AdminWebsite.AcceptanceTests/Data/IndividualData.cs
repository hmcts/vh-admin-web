using AdminWebsite.AcceptanceTests.Configuration;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class IndividualData : ParticipantData
    {
        public IndividualData()
        {
            HouseNumber = "102";
            Street = "Petty France";
            City = "London";
            County = "Greater London";
            PostCode = "SW1H 9AJ";
        }

        public override void AddUserData(UserAccount user)
        {
            Email = user.Username;
            Firstname = user.Firstname;
            Lastname = user.Lastname;
            DisplayName = user.Displayname;
        }
    }
}
