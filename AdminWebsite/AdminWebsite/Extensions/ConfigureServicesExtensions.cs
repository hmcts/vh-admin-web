using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Configuration;
using AdminWebsite.Helper;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.Swagger;
using AdminWebsite.UserAPI.Client;
using AdminWebsite.Validators;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;
using Swashbuckle.AspNetCore.Swagger;

namespace AdminWebsite.Extensions
{
    public static class ConfigureServicesExtensions
    {
        public static IServiceCollection AddSwagger(this IServiceCollection serviceCollection)
        {
            serviceCollection.AddSwaggerGen(c =>
            {
                var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                c.IncludeXmlComments(xmlPath);

                c.SwaggerDoc("v1", new Info {Title = "Book A Hearing Client", Version = "v1"});
                c.EnableAnnotations();
                
                // Quick fix to avoid conflicts between bookings contract and the local contract
                // this should be deleted as we introduce local modals and not expose bookings api contracts
                c.CustomSchemaIds(i => i.FullName);
                
                c.OperationFilter<AuthResponsesOperationFilter>();
                
                c.AddSecurityDefinition("Bearer", new ApiKeyScheme { In = "header", Description = "Please enter JWT with Bearer into field", Name = "Authorization", Type = "apiKey" });
                c.AddSecurityRequirement(new Dictionary<string, IEnumerable<string>> {
                    { "Bearer", Enumerable.Empty<string>() },
                });
            });

            return serviceCollection;
        }
        
        public static IServiceCollection AddCustomTypes(this IServiceCollection serviceCollection)
        {
            serviceCollection.AddMemoryCache();
            serviceCollection.AddTransient<HearingApiTokenHandler>();
            serviceCollection.AddTransient<UserApiTokenHandler>();
            serviceCollection.AddScoped<ITokenProvider, TokenProvider>();
            serviceCollection.AddScoped<IActiveDirectoryGroup, ActiveDirectoryGroup>();
            serviceCollection.AddScoped<IUserAccountService, UserAccountService>();
            serviceCollection.AddScoped<SecuritySettings>();
            serviceCollection.AddScoped<AppConfigSettings>();
            serviceCollection.AddSingleton<IClaimsCacheProvider, MemoryClaimsCacheProvider>();
            serviceCollection.AddScoped<ICachedUserClaimBuilder, CachedUserClaimBuilder>();

            // Build the hearings api client using a reusable HttpClient factory and predefined base url
            var container = serviceCollection.BuildServiceProvider();
            var settings = container.GetService<IOptions<ServiceSettings>>().Value;
            
            serviceCollection.AddHttpClient<IBookingsApiClient, BookingsApiClient>()
                .AddHttpMessageHandler(() => container.GetService<HearingApiTokenHandler>())
                .AddTypedClient(httpClient => BuildHearingApiClient(httpClient, settings));

            serviceCollection.AddHttpClient<IUserApiClient, UserApiClient>()
               .AddHttpMessageHandler(() => container.GetService<UserApiTokenHandler>())
               .AddTypedClient(httpClient => BuildUserApiClient(httpClient, settings));

            serviceCollection.AddTransient<IUserIdentity, UserIdentity>((ctx) =>
            {
                var userPrincipal = ctx.GetService<IHttpContextAccessor>().HttpContext.User;

                return new UserIdentity(userPrincipal);
            });

            serviceCollection.AddSingleton<IValidator<BookNewHearingRequest>, BookNewHearingRequestValidator>();

            return serviceCollection;
        }
        
        private static IBookingsApiClient BuildHearingApiClient(HttpClient httpClient, ServiceSettings serviceSettings)
        {
            return new BookingsApiClient(httpClient) { BaseUrl = serviceSettings.BookingsApiUrl };
        }

        private static IUserApiClient BuildUserApiClient(HttpClient httpClient, ServiceSettings serviceSettings)
        {
            return new UserApiClient(httpClient) { BaseUrl = serviceSettings.UserApiUrl };
        }

        public static IServiceCollection AddJsonOptions(this IServiceCollection serviceCollection)
        {
            var contractResolver = new DefaultContractResolver
            {
                NamingStrategy = new SnakeCaseNamingStrategy()
            };

            serviceCollection.AddMvc()
                .AddJsonOptions(options => options.SerializerSettings.ContractResolver = contractResolver)
                .AddJsonOptions(options => options.SerializerSettings.Converters.Add(new StringEnumConverter()));

            return serviceCollection;
        }
    }
}
