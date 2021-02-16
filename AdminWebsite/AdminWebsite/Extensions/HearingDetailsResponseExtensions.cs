using System;
using AdminWebsite.BookingsAPI.Client;

namespace AdminWebsite.Extensions
{
    public static class HearingDetailsResponseExtensions
    {
        public static bool IsGenericHearing(this HearingDetailsResponse hearing)
        {
            return hearing.Case_type_name.Equals("Generic", StringComparison.CurrentCultureIgnoreCase);
        }
    }
}