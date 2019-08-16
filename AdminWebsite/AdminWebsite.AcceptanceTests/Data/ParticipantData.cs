using AdminWebsite.AcceptanceTests.Configuration;

namespace AdminWebsite.AcceptanceTests.Data
{
    public abstract class ParticipantData
    {
        protected ParticipantData()
        {
            Email = $"Automation_{Faker.Internet.Email()}";
            Title = "Mrs";
            Firstname = $"Automation_{Faker.Name.First()}";
            Lastname = $"Automation_{Faker.Name.Last()}";
            DisplayName = $"Automation_{Faker.Name.FullName()}";
            Telephone = "+44(0)7969325908";            
        }

        public string Email { get; set; }
        public string Title { get; set; }
        public string Firstname { get; set; }
        public string Lastname { get; set; }
        public string Telephone { get; set; }
        public string DisplayName { get; set; }
        public string HouseNumber { get; set; }
        public string Street { get; set; }
        public string City { get; set; }
        public string County { get; set; }
        public string PostCode { get; set; }
        public string Organisation { get; set; }
        public string SolicitorReference { get; set; }
        public string ClientRepresenting { get; set; }
        public RoleType Role { get; set; }

        public abstract void AddUserData(UserAccount user);

        public string Update(string value)
        {
            return $"{value} Updated";
        }
    }
}