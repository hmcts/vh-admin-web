using AdminWebsite.BookingsAPI.Client;
using FizzWare.NBuilder;
using System.Linq;

namespace Testing.Common.Builders.Request
{
    public class CreateHearingRequest
    {
        public static BookNewHearingRequest BuildRequest(string contactEmail, string firstname, string lastname)
        {
            var participant = Builder<ParticipantRequest>.CreateListOfSize(1).All()
                .With(x => x.Case_role_name = "Claimant")
                .With(x => x.Hearing_role_name = "Claimant LIP")
                .With(x => x.Title = "Mr")
                .With(x => x.First_name = firstname)
                .With(x => x.Last_name = lastname)
                .With(x => x.Username = $"{firstname}.{lastname}@hearings.reform.hmcts.net")
                .With(x => x.Contact_email = contactEmail)
                .With(x => x.Telephone_number = "1234567890")
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