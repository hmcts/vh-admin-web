using System.Collections.Generic;
using AcceptanceTests.Common.Data.Questions;
using AdminWebsite.BookingsAPI.Client;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    internal static class SuitabilityAnswers
    {
        public static List<SuitabilityAnswersRequest> Build(string role, string extendedAnswer)
        {
            var answer1 = new SuitabilityAnswersRequest
            {
                Key = SelfTestQuestionKeys.SeeYourselfQuestion,
                Extended_answer = null,
                Answer = "true"
            };

            var answer2 = new SuitabilityAnswersRequest
            {
                Key = SelfTestQuestionKeys.MicrophoneQuestion,
                Extended_answer = null,
                Answer = "true"
            };

            var answer3 = new SuitabilityAnswersRequest();
            if (role.ToLower().Equals("individual"))
            {
                answer3.Key = IndividualQuestionKeys.AboutYouQuestion;
                answer3.Extended_answer = extendedAnswer;
                answer3.Answer = "true";
            }
            else
            {
                answer3.Key = RepresentativeQuestionKeys.OtherInformation;
                answer3.Extended_answer = extendedAnswer;
                answer3.Answer = "true";
            }

            return new List<SuitabilityAnswersRequest> { answer1, answer2, answer3 };
        }
    }
}
