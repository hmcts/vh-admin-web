using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.ApplicationInsights;
using VH.Core.Configuration;

namespace AdminWebsite
{
    public static class Program
    {
        public static void Main(string[] args)
        {
            CreateWebHostBuilder(args).Build().Run();
        }

        private static IHostBuilder CreateWebHostBuilder(string[] args)
        {
            const string vhInfraCore = "/mnt/secrets/vh-infra-core";
            const string vhAdminWeb = "/mnt/secrets/vh-admin-web";
            var keyVaults=new List<string> (){
                "vh-infra-core",
                "vh-admin-web",
                "vh-bookings-api",
                "vh-video-api",
                "vh-notification-api",
                "vh-user-api"
            };


            return Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((configBuilder) =>
                {
                    foreach (var keyVault in keyVaults)
                    {
                        configBuilder.AddAksKeyVaultSecretProvider($"/mnt/secrets/{keyVault}");
                    }
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseContentRoot(Directory.GetCurrentDirectory());
                    webBuilder.UseIISIntegration();
                    webBuilder.UseStartup<Startup>();
                    webBuilder.ConfigureLogging((hostingContext, logging) =>
                    {
                        logging.AddEventSourceLogger();
                        logging.AddFilter<ApplicationInsightsLoggerProvider>("", LogLevel.Trace);
                    });
                    webBuilder.ConfigureAppConfiguration(configBuilder =>
                    {
                        configBuilder.AddAksKeyVaultSecretProvider(vhInfraCore);
                        configBuilder.AddAksKeyVaultSecretProvider(vhAdminWeb);
                    });
                });
        }
    }
}