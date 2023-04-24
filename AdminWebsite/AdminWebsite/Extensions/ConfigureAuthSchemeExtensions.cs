using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using AdminWebsite.Configuration;
using AdminWebsite.Models;
using AdminWebsite.Security.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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

            var vhSecuritySettings = configuration.GetSection(AzureAdConfiguration.ConfigSectionKey).Get<AzureAdConfiguration>();
            var dom1SecuritySettings = configuration.GetSection(Dom1AdConfiguration.ConfigSectionKey).Get<Dom1AdConfiguration>();
            
            var providerSchemes = new List<IProviderSchemes>
            {
                new VhAadScheme(vhSecuritySettings),
                new Dom1Scheme(dom1SecuritySettings)
            };

            var authenticationBuilder = serviceCollection.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddPolicyScheme(JwtBearerDefaults.AuthenticationScheme, "Handler", options =>
            {
                options.ForwardDefaultSelector = context =>
                {
                    var provider = GetProviderFromRequest(context.Request, providerSchemes);
                    return providerSchemes.Single(s => s.Provider == provider).GetScheme();
                };
            });
            foreach (var scheme in providerSchemes)
            {
                authenticationBuilder = scheme.AddSchemes(authenticationBuilder);
            }
            serviceCollection.AddAuthPolicies(providerSchemes);
            
            // IdpConfiguration securitySettings = dom1SecuritySettings.Enabled ? dom1SecuritySettings : vhSecuritySettings;
            
            
            
            
            // serviceCollection.AddAuthentication(options =>
            //     {
            //         options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            //         options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            //     })
            //     .AddPolicyScheme(JwtBearerDefaults.AuthenticationScheme, SchemeName, options => options.ForwardDefaultSelector = context => SchemeName)
            //     .AddJwtBearer(SchemeName, options =>
            //     {
            //         options.Authority = $"{securitySettings.Authority}{securitySettings.TenantId}/v2.0";
            //         options.TokenValidationParameters.ValidateLifetime = true;
            //         options.Audience = securitySettings.ClientId;
            //         options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
            //         options.TokenValidationParameters.NameClaimType = "preferred_username";
            //     });
            //
            // serviceCollection.AddAuthorization();
            //
            // serviceCollection.AddAuthPolicies();
        }
        
        public static AuthProvider GetProviderFromRequest(HttpRequest httpRequest, IList<IProviderSchemes> providerSchemes)
        {
            var defaultScheme = AuthProvider.VHAAD;
            if (httpRequest.Headers.TryGetValue("Authorization", out var authHeader))
            {
                var jwtToken = new JwtSecurityToken(authHeader.ToString().Replace("Bearer ", string.Empty));
                return providerSchemes.SingleOrDefault(s => s.BelongsToScheme(jwtToken))?.Provider ?? defaultScheme;
            }

            return defaultScheme;
        }

        private static void AddAuthPolicies(this IServiceCollection serviceCollection, IList<IProviderSchemes> providerSchemes)
        {
            // serviceCollection.AddAuthorization(AddPolicies);
            // serviceCollection.AddMvc(AddMvcPolicies);
            
            serviceCollection.AddAuthorization(options => AddPolicies(options, providerSchemes));
            serviceCollection.AddMvc(options => options.Filters.Add(new AuthorizeFilter(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())));
        }

        private static void AddPolicies(AuthorizationOptions options, IList<IProviderSchemes> schemes)
        {
            var allRoles = new[] { AppRoles.CaseAdminRole, AppRoles.VhOfficerRole };
            // options.AddPolicy(SchemeName, new AuthorizationPolicyBuilder()
            //     .RequireAuthenticatedUser()
            //     .RequireRole(allRoles)
            //     .AddAuthenticationSchemes(SchemeName)
            //     .Build());
            
            foreach (var scheme in schemes.SelectMany(s => s.GetProviderSchemes()))
            {
                options.AddPolicy(scheme, new AuthorizationPolicyBuilder()
                    .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
                    .RequireAuthenticatedUser()
                    .RequireRole(allRoles)               
                    .Build());
            }
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
