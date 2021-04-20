using AdminWebsite.Models;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Text.RegularExpressions;
using BookingsApi.Contract.Requests;

namespace AdminWebsite.Attributes
{
    public class HearingInputSanitizerAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            if (context.ActionArguments != null && context.ActionArguments.ContainsKey("request"))
            {
                switch (context.ActionArguments["request"])
                {
                    case BookNewHearingRequest newHearingRequest:
                        newHearingRequest.HearingRoomName = Sanitize(newHearingRequest.HearingRoomName);
                        newHearingRequest.HearingVenueName = Sanitize(newHearingRequest.HearingVenueName);
                        newHearingRequest.OtherInformation = Sanitize(newHearingRequest.OtherInformation);

                        newHearingRequest.Cases?.ForEach(x =>
                        {
                            x.Name = Sanitize(x.Name);
                            x.Number = Sanitize(x.Number);
                        });

                        newHearingRequest.Participants?.ForEach(x =>
                        {
                            x.Title = Sanitize(x.Title);
                            x.FirstName = Sanitize(x.FirstName);
                            x.MiddleNames = Sanitize(x.MiddleNames);
                            x.LastName = Sanitize(x.LastName);
                            x.DisplayName = Sanitize(x.DisplayName);
                            x.TelephoneNumber = Sanitize(x.TelephoneNumber);
                            x.Representee = Sanitize(x.Representee);
                            x.OrganisationName = Sanitize(x.OrganisationName);
                        });
                        break;
                    case EditHearingRequest editHearingRequest:
                        editHearingRequest.HearingRoomName = Sanitize(editHearingRequest.HearingRoomName);
                        editHearingRequest.HearingVenueName = Sanitize(editHearingRequest.HearingVenueName);
                        editHearingRequest.OtherInformation = Sanitize(editHearingRequest.OtherInformation);

                        if (editHearingRequest.Case != null)
                        {
                            editHearingRequest.Case.Name = Sanitize(editHearingRequest.Case.Name);
                            editHearingRequest.Case.Number = Sanitize(editHearingRequest.Case.Number);
                        }

                        editHearingRequest.Participants?.ForEach(x =>
                        {
                            x.Title = Sanitize(x.Title);
                            x.FirstName = Sanitize(x.FirstName);
                            x.MiddleNames = Sanitize(x.MiddleNames);
                            x.LastName = Sanitize(x.LastName);
                            x.DisplayName = Sanitize(x.DisplayName);
                            x.TelephoneNumber = Sanitize(x.TelephoneNumber);
                            x.Representee = Sanitize(x.Representee);
                            x.OrganisationName = Sanitize(x.OrganisationName);
                        });
                        break;
                }
            }

            base.OnActionExecuting(context);
        }

        private static string Sanitize(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return input;
            }

            var regex = new Regex(@"<(.*?)>", RegexOptions.Compiled);

            return regex.Replace(input, string.Empty);
        }
    }
}