using System;
using System.Linq;
using System.Net;
using LaunchDarkly.Logging;
using LaunchDarkly.Sdk;
using LaunchDarkly.Sdk.Server;
using LaunchDarkly.Sdk.Server.Interfaces;

namespace AdminWebsite.Configuration
{
    public interface IFeatureToggles
    {
        public bool BookAndConfirmToggle();
        public bool Dom1Enabled();
    }
    
    public class FeatureToggles : IFeatureToggles
    {
        private readonly ILdClient _ldClient;
        private readonly User _user;
        private const string LdUser = "vh-admin-web";
        private const string BookAndConfirmToggleKey = "Book_and_Confirm";
        private const string Dom1EnabledToggleKey = "dom1";
        public FeatureToggles(string sdkKey, string environmentName)
        {
            
            var config = LaunchDarkly.Sdk.Server.Configuration.Builder(sdkKey)
                .Logging(
                    Components.Logging(Logs.ToWriter(Console.Out)).Level(LogLevel.Warn)
                )
                .Build();
            
            _ldClient = new LdClient(config);
            // the first param is key and set to LDUser. This is the app name and not to be confused with the Darkly SDK Key 
            _user = new User(LdUser, null, null, null, null, null, environmentName, null, null, null, null, null);
        }

        public bool BookAndConfirmToggle() => _ldClient.BoolVariation(BookAndConfirmToggleKey, _user);
        public bool Dom1Enabled()
        {
            return _ldClient.BoolVariation(Dom1EnabledToggleKey, _user);
        }
    }
}