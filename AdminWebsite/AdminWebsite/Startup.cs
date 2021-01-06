using AdminWebsite.Configuration;
using AdminWebsite.Extensions;
using AdminWebsite.Helper;
using AdminWebsite.Middleware;
using AdminWebsite.Services;
using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

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

            services.RegisterAuthSchemes(Configuration);
            services.AddMvc(opt => opt.Filters.Add(typeof(LoggingMiddleware))).SetCompatibilityVersion(CompatibilityVersion.Version_3_0);
            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_3_0);

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration => { configuration.RootPath = "ClientApp/dist"; });
        }

        private void RegisterSettings(IServiceCollection services)
        {
            services.Configure<SecuritySettings>(options => Configuration.Bind("AzureAd", options));
            services.Configure<ServiceSettings>(options => Configuration.Bind("VhServices", options));
            services.Configure<TestUserSecrets>(options => Configuration.Bind("TestUserSecrets", options));
            services.Configure<AppConfigSettings>(options => Configuration.Bind(options));
            services.Configure<SecuritySettings>(options => Configuration.Bind("ApplicationInsights", options));
            services.Configure<ServiceSettings>(options => Configuration.Bind("KinlyConfiguration", options));
        }
        
        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
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
            app.UseHttpsRedirection();
            app.UseStaticFiles();
            if (!env.IsDevelopment())
            {
                app.UseSpaStaticFiles();
            }
            app.UseAuthentication();

            app.UseMiddleware<ExceptionMiddleware>();

            // HTTP Response Headers
            app.UseXContentTypeOptions();
            app.UseReferrerPolicy(opts => opts.NoReferrer());
            app.UseXXssProtection(options => options.EnabledWithBlockMode());
            app.UseNoCacheHttpHeaders();
            app.UseHsts(options => options.MaxAge(365).IncludeSubdomains());
            app.UseXfo(options => options.SameOrigin());

            app.UseEndpoints(endpoints => { endpoints.MapDefaultControllerRoute(); });

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
