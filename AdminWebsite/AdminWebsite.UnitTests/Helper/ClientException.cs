using System;
using System.Collections.Generic;
using System.Net;
using BookingsApi.Client;
using UserApi.Client;

namespace AdminWebsite.UnitTests.Helper
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
                (int)statusCode,
                statusCode.ToString(),
                new Dictionary<string, IEnumerable<string>>(),
                null
            );
        }

        public static Exception ForUserService(HttpStatusCode statusCode)
        {
            return new UserApiException(
                statusCode.ToString(),
                (int)statusCode,
                statusCode.ToString(),
                new Dictionary<string, IEnumerable<string>>(),
                null
            );
        }
    }
}
