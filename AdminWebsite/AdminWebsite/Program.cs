using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Azure.KeyVault;
using Microsoft.Azure.Services.AppAuthentication;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.AzureKeyVault;
using Microsoft.Extensions.Configuration.Json;
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

            return Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((context, config) =>
                {
                    if (!context.HostingEnvironment.IsDevelopment())
                    {
                        config.AddAksKeyVaultSecretProvider(vhInfraCore);
                        config.AddAksKeyVaultSecretProvider(vhAdminWeb);
                    }
                    else
                    {
                        var builtConfig = config.Build();
                        var vaultName = builtConfig["KeyVaultName"];
                        var notLocalDebug = builtConfig["NotLocalDebug"];

                        if (bool.Parse(notLocalDebug))
                        {
                            // initialized -1 just to throuh out of bound exception if the secrets.json file not found in the list for sources
                            var secretIndex = -1;
                            foreach (var item in config.Sources.Select((value, i) => new { i, value }))
                            {
                                if (item.value is JsonConfigurationSource jsonSource)
                                {
                                    if (jsonSource.Path == "secrets.json")
                                    {
                                        secretIndex = item.i;
                                    }
                                }
                            }

                            config.Sources.RemoveAt(secretIndex);

                            var azureServiceTokenProvider = new AzureServiceTokenProvider();
                            var keyVaultClient = new KeyVaultClient(
                                new KeyVaultClient.AuthenticationCallback(
                                    azureServiceTokenProvider.KeyVaultTokenCallback));
                            config.AddAzureKeyVault(
                                $"https://{vaultName}.vault.azure.net/", keyVaultClient, new DefaultKeyVaultSecretManager());
                        }
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