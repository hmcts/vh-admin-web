using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.ApplicationInsights;
using VH.Core.Configuration;
using System.Collections.Generic;

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
                        foreach (var keyVault in keyVaults)
                        {
                            configBuilder.AddAksKeyVaultSecretProvider($"/mnt/secrets/{keyVault}");
                        }
                    });
                });
        }
    }
}