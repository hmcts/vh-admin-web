using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using AdminWebsite.Configuration;
using AdminWebsite.Models;
using AdminWebsite.Security.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AdminWebsite.Extensions
{
    [ExcludeFromCodeCoverage]
    public static class ConfigureAuthSchemeExtensions
    {

        public static void RegisterAuthSchemes(this IServiceCollection serviceCollection, IConfiguration configuration)
        {
            var policy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();

            serviceCollection.AddMvc(options => { options.Filters.Add(new AuthorizeFilter(policy)); });

            var vhSecuritySettings = configuration.GetSection(AzureAdConfiguration.ConfigSectionKey)
                .Get<AzureAdConfiguration>();
            var dom1SecuritySettings = configuration.GetSection(Dom1AdConfiguration.ConfigSectionKey)
                .Get<Dom1AdConfiguration>();

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
        }

        public static AuthProvider GetProviderFromRequest(HttpRequest httpRequest,
            IList<IProviderSchemes> providerSchemes)
        {
            var defaultScheme = AuthProvider.VHAAD;
            return httpRequest.Headers.TryGetValue("Authorization", out var authHeader) ? 
                GetProviderFromToken(authHeader.ToString().Replace("Bearer ", string.Empty), providerSchemes) : 
                defaultScheme;
        }

        private static AuthProvider GetProviderFromToken(string token, IList<IProviderSchemes> providerSchemes)
        {
            var defaultScheme = AuthProvider.VHAAD;
            var jwtToken = new JwtSecurityToken(token);
            return providerSchemes.SingleOrDefault(s => s.BelongsToScheme(jwtToken))?.Provider ?? defaultScheme;
        }

        private static void AddAuthPolicies(this IServiceCollection serviceCollection,
            IList<IProviderSchemes> providerSchemes)
        {
            serviceCollection.AddAuthorization(options => AddPolicies(options, providerSchemes));
            serviceCollection.AddMvc(options =>
                options.Filters.Add(
                    new AuthorizeFilter(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())));
        }

        private static void AddPolicies(AuthorizationOptions options, IList<IProviderSchemes> schemes)
        {
            var allRoles = new[] {AppRoles.CaseAdminRole, AppRoles.VhOfficerRole};
            
            var rolePolicies = new Dictionary<string, string[]>
            {
                [AppRoles.AdministratorRole] = new []{AppRoles.AdministratorRole}
            };


            foreach (var scheme in schemes.SelectMany(s => s.GetProviderSchemes()))
            {
                options.AddPolicy(scheme, new AuthorizationPolicyBuilder()
                    .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
                    .RequireAuthenticatedUser()
                    .RequireRole(allRoles)
                    .Build());
            }
            
            foreach (var policy in rolePolicies)
            {
                var policyBuilder = new AuthorizationPolicyBuilder()
                    .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
                    .RequireAuthenticatedUser()
                    .RequireRole(policy.Value);
                options.AddPolicy(policy.Key, policyBuilder.Build());
            }
        }
    }
}
