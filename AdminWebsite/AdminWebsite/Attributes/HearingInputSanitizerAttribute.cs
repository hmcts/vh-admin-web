using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Text.RegularExpressions;

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
                        newHearingRequest.Hearing_room_name = Sanitize(newHearingRequest.Hearing_room_name);
                        newHearingRequest.Hearing_venue_name = Sanitize(newHearingRequest.Hearing_venue_name);
                        newHearingRequest.Other_information = Sanitize(newHearingRequest.Other_information);

                        newHearingRequest.Cases?.ForEach(x =>
                        {
                            x.Name = Sanitize(x.Name);
                            x.Number = Sanitize(x.Number);
                        });

                        newHearingRequest.Participants?.ForEach(x =>
                        {
                            x.Title = Sanitize(x.Title);
                            x.First_name = Sanitize(x.First_name);
                            x.Middle_names = Sanitize(x.Middle_names);
                            x.Last_name = Sanitize(x.Last_name);
                            x.Display_name = Sanitize(x.Display_name);
                            x.Telephone_number = Sanitize(x.Telephone_number);
                            x.Reference = Sanitize(x.Reference);
                            x.Representee = Sanitize(x.Representee);
                            x.Organisation_name = Sanitize(x.Organisation_name);
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
                            x.Reference = Sanitize(x.Reference);
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