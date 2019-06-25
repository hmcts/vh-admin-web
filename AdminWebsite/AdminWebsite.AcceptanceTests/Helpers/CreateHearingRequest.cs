using AdminWebsite.BookingsAPI.Client;
using FizzWare.NBuilder;
using System.Collections.Generic;
using System.Linq;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    internal static class CreateHearingRequest
    {
        public static BookNewHearingRequest BuildRequest()
        {
            var participants = Builder<ParticipantRequest>.CreateListOfSize(3).All()
                .With(x => x.Contact_email = Faker.Internet.Email())
                .With(x => x.Username = Faker.Internet.Email())
                .Build().ToList();
            participants[0].Case_role_name = "Claimant";
            participants[0].Hearing_role_name = "Claimant LIP";

            participants[1].Case_role_name = "Claimant";
            participants[1].Hearing_role_name = "Solicitor";

            participants[2].Case_role_name = "Judge";
            participants[2].Hearing_role_name = "Judge";

            var cases = Builder<CaseRequest>.CreateListOfSize(2).Build().ToList();

            var createdBy = "caseAdmin@emailaddress.com";

            return Builder<BookNewHearingRequest>.CreateNew()
                .With(x => x.Case_type_name = "Civil Money Claims")
                .With(x => x.Hearing_type_name = "Application to Set Judgment Aside")
                .With(x => x.Hearing_venue_name = "Birmingham Civil and Family Justice Centre")
                .With(x => x.Participants = participants)
                .With(x => x.Cases = cases)
                .With(x => x.Created_by = createdBy)
                .Build();
        }

        public static List<SuitabilityAnswersRequest> BuildSuitabilityAnswerRequest()
        {
            var answer1 = new SuitabilityAnswersRequest
            {
                Key = "ABOUT_YOU",
                Extended_answer = "Comments",
                Answer = "Yes"
            };

            var answer2 = new SuitabilityAnswersRequest
            {
                Key = "ROOM",
                Extended_answer = "",
                Answer = "Yes"
            };

            return new List<SuitabilityAnswersRequest> { answer1, answer2 };
        }
    }
}
