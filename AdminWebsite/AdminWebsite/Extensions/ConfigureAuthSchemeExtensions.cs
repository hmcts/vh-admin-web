using System;
using AdminWebsite.Configuration;
using AdminWebsite.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AdminWebsite.Extensions
{
    public static class ConfigureAuthSchemeExtensions
    {
        private static string SchemeName => "Default";
        public static void RegisterAuthSchemes(this IServiceCollection serviceCollection, IConfiguration configuration)
        {
            var policy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();

            serviceCollection.AddMvc(options => { options.Filters.Add(new AuthorizeFilter(policy)); });

            var vhSecuritySettings = configuration.GetSection("AzureAd").Get<AzureAdConfiguration>();
            var dom1SecuritySettings = configuration.GetSection(Dom1AdConfiguration.ConfigSectionKey).Get<Dom1AdConfiguration>();
            IdpConfiguration securitySettings = dom1SecuritySettings.Enabled ? dom1SecuritySettings : vhSecuritySettings;
            
            
            serviceCollection.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddPolicyScheme(JwtBearerDefaults.AuthenticationScheme, SchemeName, options => options.ForwardDefaultSelector = context => SchemeName)
                .AddJwtBearer(SchemeName, options =>
                {
                    options.Authority = $"{securitySettings.Authority}{securitySettings.TenantId}/v2.0";
                    options.TokenValidationParameters.ValidateLifetime = true;
                    options.Audience = securitySettings.ClientId;
                    options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
                    options.TokenValidationParameters.NameClaimType = "preferred_username";
                });

            serviceCollection.AddAuthorization();

            serviceCollection.AddAuthPolicies();
        }

        private static void AddAuthPolicies(this IServiceCollection serviceCollection)
        {
            serviceCollection.AddAuthorization(AddPolicies);
            serviceCollection.AddMvc(AddMvcPolicies);
        }

        private static void AddPolicies(AuthorizationOptions options)
        {
            var allRoles = new[] { AppRoles.CaseAdminRole, AppRoles.VhOfficerRole };
            options.AddPolicy(SchemeName, new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(allRoles)
                .AddAuthenticationSchemes(SchemeName)
                .Build());
        }

        private static void AddMvcPolicies(MvcOptions options)
        {
            var allRoles = new[] { AppRoles.CaseAdminRole, AppRoles.VhOfficerRole };
            options.Filters.Add(new AuthorizeFilter(new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(allRoles).Build()));
        }
    }
}
