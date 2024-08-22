using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Middleware;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.Swagger;
using AdminWebsite.Validators;
using BookingsApi.Client;
using FluentValidation;
using MicroElements.Swashbuckle.FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;
using NotificationApi.Client;
using UserApi.Client;
using VideoApi.Client;

namespace AdminWebsite.Extensions
{
    public static class ConfigureServicesExtensions
    {
        public static IServiceCollection AddSwagger(this IServiceCollection serviceCollection)
        {
            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);

            var contractsXmlFile = $"{typeof(ClientSettingsResponse).Assembly.GetName().Name}.xml";
            var contractsXmlPath = Path.Combine(AppContext.BaseDirectory, contractsXmlFile);
            serviceCollection.AddFluentValidationRulesToSwagger();
            serviceCollection.AddSwaggerGen(c =>
            {
                c.CustomSchemaIds((type) => type.FullName);
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Book A Hearing Client", Version = "v1" });
                c.IncludeXmlComments(xmlPath);
                c.IncludeXmlComments(contractsXmlPath);
                c.EnableAnnotations();

                c.AddSecurityDefinition("Bearer",
                    new OpenApiSecurityScheme
                    {
                        Description = "Please enter JWT with Bearer into field",
                        Type = SecuritySchemeType.Http,
                        Scheme = "bearer"
                    });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement{
                    {
                        new OpenApiSecurityScheme{
                            Reference = new OpenApiReference{
                                Id = "Bearer",
                                Type = ReferenceType.SecurityScheme
                            }
                        },new List<string>()
                    }
                });
                c.OperationFilter<AuthResponsesOperationFilter>();
            });
            serviceCollection.AddSwaggerGenNewtonsoftSupport();

            return serviceCollection;
        }

        public static IServiceCollection AddCustomTypes(this IServiceCollection serviceCollection)
        {
            serviceCollection.AddHttpContextAccessor();
            serviceCollection.AddMemoryCache();
            serviceCollection.AddTransient<HearingApiTokenHandler>();
            serviceCollection.AddTransient<UserApiTokenHandler>();
            serviceCollection.AddTransient<VideoApiTokenHandler>();
            serviceCollection.AddTransient<NotificationApiTokenHandler>();
            serviceCollection.AddTransient<IHearingsService, HearingsService>();
            serviceCollection.AddTransient<IConferenceDetailsService, ConferenceDetailsService>();
            serviceCollection.AddScoped<ITokenProvider, TokenProvider>();
            serviceCollection.AddScoped<IUserAccountService, UserAccountService>();
            serviceCollection.AddScoped<AzureAdConfiguration>();
            serviceCollection.AddScoped<IAppRoleService, AppRoleService>();
            serviceCollection.AddSingleton<IPollyRetryService, PollyRetryService>();
            serviceCollection.AddScoped<IReferenceDataService, ReferenceDataService>();
            serviceCollection.AddTransient<VhApiLoggingDelegatingHandler>();

            // Build the hearings api client using a reusable HttpClient factory and predefined base url
            var container = serviceCollection.BuildServiceProvider();
            var settings = container.GetService<IOptions<ServiceConfiguration>>().Value;

            serviceCollection.AddHttpClient<IBookingsApiClient, BookingsApiClient>()
                .AddHttpMessageHandler(() => container.GetService<HearingApiTokenHandler>())
                .AddHttpMessageHandler<VhApiLoggingDelegatingHandler>()
                .AddTypedClient(httpClient =>
                {
                    var client = BookingsApiClient.GetClient(httpClient);
                    client.BaseUrl = settings.BookingsApiUrl;
                    client.ReadResponseAsString = true;
                    return (IBookingsApiClient)client;
                });

            serviceCollection.AddHttpClient<IUserApiClient, UserApiClient>()
                .AddHttpMessageHandler(() => container.GetService<UserApiTokenHandler>())
                .AddHttpMessageHandler<VhApiLoggingDelegatingHandler>()
                .AddTypedClient(httpClient =>
                {
                    var client = UserApiClient.GetClient(httpClient);
                    client.BaseUrl = settings.UserApiUrl;
                    client.ReadResponseAsString = true;
                    return (IUserApiClient)client;
                });

            serviceCollection.AddHttpClient<IVideoApiClient, VideoApiClient>()
                .AddHttpMessageHandler(() => container.GetService<VideoApiTokenHandler>())
                .AddHttpMessageHandler<VhApiLoggingDelegatingHandler>()
                .AddTypedClient(httpClient =>
                {
                    var client = VideoApiClient.GetClient(httpClient);
                    client.BaseUrl = settings.VideoApiUrl;
                    client.ReadResponseAsString = true;
                    return (IVideoApiClient) client;
                });

            serviceCollection.AddHttpClient<INotificationApiClient, NotificationApiClient>()
                .AddHttpMessageHandler(() => container.GetService<NotificationApiTokenHandler>())
                .AddHttpMessageHandler<VhApiLoggingDelegatingHandler>()
                .AddTypedClient(httpClient =>
                {
                    var client = NotificationApiClient.GetClient(httpClient);
                    client.BaseUrl = settings.NotificationApiUrl;
                    client.ReadResponseAsString = true;
                    return (INotificationApiClient)client;

                });

            serviceCollection.AddHttpClient<IPublicHolidayRetriever, UkPublicHolidayRetriever>();
            serviceCollection.AddTransient<IUserIdentity, UserIdentity>((ctx) =>
            {
                var userPrincipal = ctx.GetService<IHttpContextAccessor>().HttpContext.User;

                return new UserIdentity(userPrincipal);
            });

            serviceCollection.AddSingleton<IValidator<EditHearingRequest>, EditHearingRequestValidator>();

            return serviceCollection;
        }
       
        public static IServiceCollection AddJsonOptions(this IServiceCollection serviceCollection)
        {
            var contractResolver = new DefaultContractResolver
            {
                NamingStrategy = new SnakeCaseNamingStrategy()
            };


            serviceCollection.AddMvc()
                .AddNewtonsoftJson(options =>
                {
                    options.SerializerSettings.ContractResolver = contractResolver;
                    options.SerializerSettings.DateTimeZoneHandling = DateTimeZoneHandling.Utc;
                    options.SerializerSettings.Converters.Add(new StringEnumConverter());
                });

            return serviceCollection;
        }
    }
}
