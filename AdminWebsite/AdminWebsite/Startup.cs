using System;
using System.Collections.Generic;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Extensions;
using AdminWebsite.Health;
using AdminWebsite.Middleware;
using Azure.Monitor.OpenTelemetry.AspNetCore;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Logging;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace AdminWebsite
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }
        private Settings Settings { get; set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            var instrumentationKey = Configuration["ApplicationInsights:ConnectionString"];
            services.AddOpenTelemetry()
                .ConfigureResource(r =>
                {
                    r.AddService("vh-admin-web")
                        .AddTelemetrySdk()
                        .AddAttributes(new Dictionary<string, object>
                            { ["service.instance.id"] = Environment.MachineName });
                })
                .UseAzureMonitor(options => options.ConnectionString = instrumentationKey) 
                .WithTracing(tracerProvider =>
                {
                    tracerProvider
                        .AddAspNetCoreInstrumentation(options => options.RecordException = true)
                        .AddHttpClientInstrumentation(options =>
                        {
                            options.RecordException = true;
                            options.EnrichWithHttpRequestMessage = (activity, request) =>
                            {
                                if (request.Content != null)
                                {
                                    var requestBody = request.Content.ReadAsStringAsync().Result;
                                    activity.SetTag("http.request.body", requestBody);
                                }
                            };

                            options.EnrichWithHttpResponseMessage = (activity, response) =>
                            {
                                var responseBody = response.Content.ReadAsStringAsync().Result;
                                activity.SetTag("http.response.body", responseBody);
                            };
                        });
                });
            
            var envName = Configuration["AzureAd:RedirectUri"]; // resource ID is a GUID, 
            
            services.AddSingleton<IFeatureToggles>(new FeatureToggles(Configuration["FeatureToggle:SdkKey"], envName));

            services.AddSwagger();
            services.AddHsts(options =>
            {
                options.IncludeSubDomains = true;
                options.MaxAge = TimeSpan.FromDays(365);
            });
            services.AddJsonOptions();
            RegisterSettings(services);

            services.AddCustomTypes();

            services.AddVhHealthChecks();

            services.RegisterAuthSchemes(Configuration);
            services.AddMvc(opt =>
            {
                opt.Filters.Add(new ProducesResponseTypeAttribute(typeof(UnexpectedErrorResponse), 500));
            });
                
            services.AddFluentValidationAutoValidation().AddFluentValidationClientsideAdapters();

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration => { configuration.RootPath = "ClientApp/dist"; });
        }

        private void RegisterSettings(IServiceCollection services)
        {
            Settings = Configuration.Get<Settings>();

            services.Configure<Dom1AdConfiguration>(options =>
                Configuration.Bind(Dom1AdConfiguration.ConfigSectionKey, options));
            services.Configure<AzureAdConfiguration>(options => Configuration.Bind("AzureAd", options));
            services.Configure<ServiceConfiguration>(options => Configuration.Bind("VhServices", options));
            services.Configure<VodafoneConfiguration>(options => Configuration.Bind("VodafoneConfiguration", options));
            services.Configure<ApplicationInsightsConfiguration>(options =>
                Configuration.Bind("ApplicationInsights", options));

            services.Configure<TestUserSecrets>(options => Configuration.Bind("TestUserSecrets", options));
            services.Configure<DynatraceConfiguration>(options => Configuration.Bind("DynatraceConfiguration", options));
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.SeedCacheWithReferenceData();
            if (!env.IsProduction()) // disable swagger url for production
            {
                app.UseSwagger();
                app.UseSwaggerUI(c => { c.SwaggerEndpoint($"/swagger/v1/swagger.json", "Book A Hearing Client"); });
            }

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
            }

            app.UseRouting();
            if (!Settings.DisableHttpsRedirection)
            {
                app.UseHttpsRedirection();
            }

            app.UseStaticFiles();
            if (!env.IsDevelopment())
            {
                app.UseSpaStaticFiles();
            }

            bool.TryParse(Configuration["ShowPII"], out var showPII);
            if (showPII)
            {
                IdentityModelEventSource.ShowPII = true;
            }

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseMiddleware<ExceptionMiddleware>();

            // HTTP Response Headers
            app.UseXContentTypeOptions();
            app.UseReferrerPolicy(opts => opts.NoReferrer());
            app.UseXXssProtection(options => options.EnabledWithBlockMode());
            app.UseNoCacheHttpHeaders();
            app.UseHsts();
            // this is a workaround to set HSTS in a docker
            // reference from https://github.com/dotnet/dotnet-docker/issues/2268#issuecomment-714613811
            app.Use(async (context, next) =>
            {
                context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000";
                await next.Invoke();
            });
            app.UseXfo(options => options.SameOrigin());

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapDefaultControllerRoute();

                endpoints.AddVhHealthCheckRouteMaps();
            });

            app.UseSpa(spa =>
            {
                // To learn more about options for serving an Angular SPA from ASP.NET Core,
                // see https://go.microsoft.com/fwlink/?linkid=864501

                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    const string ngBaseUri = "http://localhost:4200/";
                    spa.UseProxyToSpaDevelopmentServer(ngBaseUri);
                }
            });
        }
    }
}
