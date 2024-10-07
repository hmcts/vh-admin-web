using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.ApplicationInsights;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.KeyPerFile;
using Microsoft.Extensions.FileProviders;

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
            var keyVaults = new List<string>(){
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
                    LoadKeyVaultsForConfig(configBuilder, keyVaults);
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
                        LoadKeyVaultsForConfig(configBuilder, keyVaults);
                    });
                });
        }
        
        private static void LoadKeyVaultsForConfig(IConfigurationBuilder configBuilder, List<string> keyVaults)
        {
            foreach (var keyVault in keyVaults)
            {
                var filePath = $"/mnt/secrets/{keyVault}";
                if (Directory.Exists(filePath))
                {
                    configBuilder.Add(GetKeyPerFileSource(filePath));
                }
            }
        }

        private static KeyPerFileConfigurationSource GetKeyPerFileSource(string filePath)
        {
            return new KeyPerFileConfigurationSource
            {
                FileProvider = new PhysicalFileProvider(filePath),
                Optional = true,
                ReloadOnChange = true,
                SectionDelimiter = "--" // Set your custom delimiter here
            };
        }
    }
}