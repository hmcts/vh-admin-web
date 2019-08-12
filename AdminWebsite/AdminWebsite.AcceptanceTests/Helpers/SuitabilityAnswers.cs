using AdminWebsite.BookingsAPI.Client;
using System.Collections.Generic;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    internal static class SuitabilityAnswers
    {
        public static List<SuitabilityAnswersRequest> Build()
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
