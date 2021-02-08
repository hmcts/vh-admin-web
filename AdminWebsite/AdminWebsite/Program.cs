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
            const string mountPath = "/mnt/secrets/vh-admin-web";

            return Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((configBuilder) =>
                {
                    configBuilder.AddAksKeyVaultSecretProvider(mountPath);
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
                        configBuilder.AddAksKeyVaultSecretProvider(mountPath);
                    });
                });
        }
    }
}