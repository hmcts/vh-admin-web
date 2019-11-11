using System.Text.RegularExpressions;
using AdminWebsite.BookingsAPI.Client;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AdminWebsite.Attributes
{
    public class HearingInputSanitizerAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            if (context.ActionArguments != null && context.ActionArguments.ContainsKey("Request"))
            {
                if (context.ActionArguments["Request"] is BookNewHearingRequest request)
                {
                    request.Other_information = Sanitize(request.Other_information);
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