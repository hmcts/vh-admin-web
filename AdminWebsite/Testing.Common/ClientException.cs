using System.Collections.Generic;
using System.Net;
using AdminWebsite.BookingsAPI.Client;

namespace Testing.Common
{
    /// <summary>
    /// Helper to generate API client exceptions
    /// </summary>
    public static class ClientException
    {
        public static BookingsApiException ForBookingsAPI(HttpStatusCode statusCode)
        {
            return new BookingsApiException(
                statusCode.ToString(), 
                (int) statusCode,
                statusCode.ToString(),
                new Dictionary<string, IEnumerable<string>>(),
                null
            );
        }
    }
}