using AdminWebsite.Services;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using BookingsApi.Client;

namespace AdminWebsite.Middleware
{
    /// <summary>
    ///     Exception Middleware
    /// </summary>
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (BookingsApiException apiException)
            {
                var properties = new Dictionary<string, string> {{"response", apiException.Response}};
                ApplicationLogger.TraceException(TraceCategory.Dependency.ToString(), "Bookings API Client Exception",
                    apiException, null, properties);
                await HandleExceptionAsync(httpContext, apiException, apiException.StatusCode);
            }
            catch (Exception ex)
            {
                ApplicationLogger.TraceException(TraceCategory.UnhandledError.ToString(),
                    "AdminWeb Unhandled Exception", ex, null,
                    null);
                await HandleExceptionAsync(httpContext, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception,
            int statusCode = (int) HttpStatusCode.InternalServerError)
        {
            context.Response.StatusCode = statusCode;
            var sb = new StringBuilder(exception.Message);
            var innerException = exception.InnerException;
            while (innerException != null)
            {
                sb.Append($" {innerException.Message}");
                innerException = innerException.InnerException;
            }

            return context.Response.WriteAsJsonAsync(sb.ToString());
        }
    }
}