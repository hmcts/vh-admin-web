using AdminWebsite.BookingsAPI.Client;
using Faker;
using FizzWare.NBuilder;
using System.Linq;

namespace Testing.Common.Builders.Request
{
    public class CreateHearingRequest
    {
        public static BookNewHearingRequest BuildRequest(string contactEmail)
        {
            var participant = Builder<ParticipantRequest>.CreateListOfSize(1).All()
                .With(x => x.Case_role_name = "Defendant")
                .With(x => x.Hearing_role_name = "Defendant LIP")
                .With(x => x.Title = Name.Prefix())
                .With(x => x.First_name = Name.First())
                .With(x => x.Last_name = Name.Last())
                .With(x => x.Username = contactEmail)
                .With(x => x.Contact_email = contactEmail)
                .With(x => x.Telephone_number = Phone.Number())
                .Build().ToList();

            var cases = Builder<CaseRequest>.CreateListOfSize(1).All()
                .With(x => x.Number = "001/AcceptanceTest")
                .With(x => x.Name = "AutomatedTest")
                .With(x => x.Is_lead_case = true)
                .Build().ToList();
            
            return Builder<BookNewHearingRequest>.CreateNew()
                .With(x => x.Case_type_name = "Civil Money Claims")
                .With(x => x.Hearing_type_name = "Application to Set Judgment Aside")
                .With(x => x.Hearing_venue_name = "Birmingham Civil and Family Justice Centre")
                .With(x => x.Participants = participant)
                .With(x => x.Cases = cases)
                .With(x => x.Created_by = "caseAdmin@emailaddress.com")
                .Build();
        }
    }
}