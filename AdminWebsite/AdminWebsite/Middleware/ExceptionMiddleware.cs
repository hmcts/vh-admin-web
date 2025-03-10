using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Security.Principal;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Helper;
using BookingsApi.Client;
using Microsoft.AspNetCore.Http;
using OpenTelemetry.Trace;
using UserApi.Client;

namespace AdminWebsite.Middleware;

/// <summary>
///     Exception Middleware
/// </summary>
public class ExceptionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext httpContext)
    {
        try
        {
            await next(httpContext);
        }
        catch (BookingsApiException apiException)
        {
            var properties = new Dictionary<string, string> { { "response", apiException.Response } };
            TraceException("Bookings API Client Exception", apiException, null, properties);
            await HandleExceptionAsync(httpContext, apiException, apiException.StatusCode);
        }
        catch (UserApiException apiException)
        {
            var properties = new Dictionary<string, string> { { "response", apiException.Response } };
            TraceException("User API Client Exception", apiException, null, properties);
            await HandleExceptionAsync(httpContext, apiException, apiException.StatusCode);
        }
        catch (Exception ex)
        {
            TraceException("AdminWeb Unhandled Exception", ex, null, null);
            await HandleExceptionAsync(httpContext, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception,
        int statusCode = (int)HttpStatusCode.InternalServerError)
    {
        context.Response.StatusCode = statusCode;
        switch (exception)
        {
            case BookingsApiException bookingsException:
                return context.Response.WriteAsJsonAsync(bookingsException.Response);
            case UserApiException userApiException:
                return context.Response.WriteAsJsonAsync(userApiException.Response);
        }

        var sb = new StringBuilder(exception.Message);
        var innerException = exception.InnerException;
        while (innerException != null)
        {
            sb.Append($" {innerException.Message}");
            innerException = innerException.InnerException;
        }

        var dto = new UnexpectedErrorResponse {ErrorMessage = sb.ToString()};
        return context.Response.WriteAsJsonAsync(dto, new JsonSerializerOptions()
        {
            PropertyNamingPolicy = new SnakeCasePropertyNamingPolicy()
        });
    }

    private static void TraceException(string eventTitle, Exception exception, IPrincipal user, IDictionary<string, string> properties)
    {
        var activity = Activity.Current;
        
        if (activity == null) return;
        activity.DisplayName = eventTitle;
        activity.RecordException(exception);
        activity.SetStatus(ActivityStatusCode.Error);
        
        if (user?.Identity != null)
            activity.AddTag("User", user.Identity.Name);

        if (properties == null) return;
        foreach (var (key, value) in properties)
        {
            activity.AddTag(key, value);
        }
    }
}