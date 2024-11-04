using System;
using LaunchDarkly.Logging;
using LaunchDarkly.Sdk;
using LaunchDarkly.Sdk.Server;
using LaunchDarkly.Sdk.Server.Interfaces;

namespace AdminWebsite.Configuration
{
    public interface IFeatureToggles
    {
        public bool Dom1Enabled();
    }

    public class FeatureToggles : IFeatureToggles
    {
        private readonly LdClient _ldClient;
        private readonly Context _context;
        private const string LdUser = "vh-admin-web";
        private const string Dom1EnabledToggleKey = "dom1";
        

        public FeatureToggles(string sdkKey, string environmentName)
        {
            var config = LaunchDarkly.Sdk.Server.Configuration.Builder(sdkKey)
                .Logging(Components.Logging(Logs.ToWriter(Console.Out)).Level(LogLevel.Warn)).Build();
            _context = Context.Builder(LdUser).Name(environmentName).Build();
            _ldClient = new LdClient(config);
        }

        public bool Dom1Enabled()
        {
            return GetBoolValueWithKey(Dom1EnabledToggleKey);
        }
        
        private bool GetBoolValueWithKey(string key)
        {
            if (!_ldClient.Initialized)
            {
                throw new InvalidOperationException("LaunchDarkly client not initialized");
            }

            return _ldClient.BoolVariation(key, _context);
        }

    }
}