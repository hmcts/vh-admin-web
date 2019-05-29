using AdminWebsite.Configuration;
using AdminWebsite.Extensions;
using AdminWebsite.Helper;
using AdminWebsite.Middleware;
using AdminWebsite.Security;
using AdminWebsite.Services;
using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AdminWebsite
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddSingleton<ITelemetryInitializer>(new CloudRoleNameInitializer());

            services.AddSwagger();
            services.AddJsonOptions();
            RegisterSettings(services);

            services.AddCustomTypes();

            RegisterAuth(services);

            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration => { configuration.RootPath = "ClientApp/dist"; });
        }

        private void RegisterSettings(IServiceCollection services)
        {
            services.Configure<SecuritySettings>(options => Configuration.Bind("AzureAd", options));
            services.Configure<ServiceSettings>(options => Configuration.Bind("VhServices", options));
            services.Configure<AppConfigSettings>(options => Configuration.Bind(options));
            services.Configure<SecuritySettings>(options => Configuration.Bind("ApplicationInsights", options));
        }

        private void RegisterAuth(IServiceCollection serviceCollection)
        {
            var policy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();

            serviceCollection.AddMvc(options => { options.Filters.Add(new AuthorizeFilter(policy)); });

            var securitySettings = Configuration.GetSection("AzureAd").Get<SecuritySettings>();

            serviceCollection.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;

            }).AddJwtBearer(options =>
            {
                options.Authority = securitySettings.Authority;
                options.TokenValidationParameters.ValidateLifetime = true;
                options.Audience = securitySettings.ClientId;
                options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
                options.Events = new JwtBearerEvents { OnTokenValidated = OnTokenValidated };
            });

            serviceCollection.AddAuthorization();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            app.UseSwagger();
            app.UseSwaggerUI(c => { c.SwaggerEndpoint("/swagger/v1/swagger.json", "Book A Hearing Client"); });

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseAuthentication();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller}/{action=Index}/{id?}");
            });
            app.UseNoCacheHttpHeaders();
            app.UseSpa(spa =>
            {
                // To learn more about options for serving an Angular SPA from ASP.NET Core,
                // see https://go.microsoft.com/fwlink/?linkid=864501

                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    spa.UseAngularCliServer(npmScript: "start");
                }
            });

            app.UseMiddleware<ExceptionMiddleware>();
        }

        private static async Task OnTokenValidated(TokenValidatedContext ctx)
        {
            if (ctx.SecurityToken is JwtSecurityToken jwtToken)
            {
                var cachedUserClaimBuilder = ctx.HttpContext.RequestServices.GetService<ICachedUserClaimBuilder>();
                var userProfileClaims = await cachedUserClaimBuilder.BuildAsync(ctx.Principal.Identity.Name, jwtToken.RawData);
                var claimsIdentity = ctx.Principal.Identity as ClaimsIdentity;

                claimsIdentity?.AddClaims(userProfileClaims);
            }
        }
    }
}
