using AdminWebsite.AcceptanceTests.Configuration;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class RepresentativeData : ParticipantData
    {
        public RepresentativeData()
        {
            Organisation = $"Automation_{Faker.Company.Name()}";
            SolicitorReference = Faker.Company.CatchPhrase();
            ClientRepresenting = "Automation User";
        }

        public override void AddUserData(UserAccount user)
        {
            Email = user.Username;
            Firstname = user.Firstname;
            Lastname = user.Lastname;
            DisplayName = user.Displayname;
            ClientRepresenting = user.Representee;
        }
    }
}
