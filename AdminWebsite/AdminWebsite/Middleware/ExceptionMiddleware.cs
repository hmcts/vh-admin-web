using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;

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
                var properties = new Dictionary<string, string> { { "response", apiException.Response } };
                ApplicationLogger.TraceException(TraceCategory.Dependency.ToString(), "Bookings API Client Exception", apiException, null, properties);
                await HandleExceptionAsync(httpContext, apiException);
            }
            catch (Exception ex)
            {
                ApplicationLogger.TraceException(TraceCategory.UnhandledError.ToString(), "AdminWeb Unhandled Exception", ex, null,
                    null);
                await HandleExceptionAsync(httpContext, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            return context.Response.WriteAsync(exception.Message);
        }
    }
}