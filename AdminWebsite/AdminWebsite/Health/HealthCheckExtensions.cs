using System;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace AdminWebsite.Health;

[ExcludeFromCodeCoverage]
public static class HealthCheckExtensions
{
    public static IServiceCollection AddVhHealthChecks(this IServiceCollection services)
    {
        var container = services.BuildServiceProvider();
        var servicesConfiguration = container.GetService<IOptions<ServiceConfiguration>>().Value;
        services.AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy())
            .AddUrlGroup(
                new Uri(
                    new Uri(servicesConfiguration.VideoApiUrl),
                    "/health/liveness"),
                name: "Video API",
                failureStatus: HealthStatus.Unhealthy,
                tags: new[] {"startup", "readiness"})
            .AddUrlGroup(
                new Uri(
                    new Uri(servicesConfiguration.BookingsApiUrl),
                    "/health/liveness"),
                name: "Bookings API",
                failureStatus: HealthStatus.Unhealthy,
                tags: new[] {"startup", "readiness"})
            .AddUrlGroup(
                new Uri(
                    new Uri(servicesConfiguration.UserApiUrl),
                    "/health/liveness"),
                name: "User API",
                failureStatus: HealthStatus.Unhealthy,
                tags: new[] {"startup", "readiness"});
        return services;
    }
    
    public static IEndpointRouteBuilder AddVhHealthCheckRouteMaps(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHealthChecks("/health/liveness", new HealthCheckOptions()
        {
            Predicate = check => check.Tags.Contains("self"),
            ResponseWriter = HealthCheckResponseWriter
        });

        endpoints.MapHealthChecks("/health/startup", new HealthCheckOptions()
        {
            Predicate = check => check.Tags.Contains("startup"),
            ResponseWriter = HealthCheckResponseWriter
        });
                
        endpoints.MapHealthChecks("/health/readiness", new HealthCheckOptions()
        {
            Predicate = check => check.Tags.Contains("readiness"),
            ResponseWriter = HealthCheckResponseWriter
        });
        
        return endpoints;
    }
    
    private static async Task HealthCheckResponseWriter(HttpContext context, HealthReport report)
    {
        var result = JsonConvert.SerializeObject(new
        {
            status = report.Status.ToString(),
            details = report.Entries.Select(e => new
            {
                key = e.Key, value = Enum.GetName(typeof(HealthStatus), e.Value.Status),
                error = e.Value.Exception?.Message
            })
        });
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(result);
    }
}
