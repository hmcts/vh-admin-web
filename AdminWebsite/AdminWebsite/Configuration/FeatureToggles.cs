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
        public bool ReferenceDataToggle();
        //public bool UseV2Api();
        public bool HrsEnabled();
    }

    public class FeatureToggles : IFeatureToggles
    {
        private readonly ILdClient _ldClient;
        private readonly Context _context;
        private const string LdUser = "vh-admin-web";
        private const string Dom1EnabledToggleKey = "dom1";
        private const string ReferenceDataToggleKey = "reference-data";
        //private const string UseV2ApiToggleKey = "use-bookings-api-v2";
        private const string HrsFeatureToggleKey = "hrs-integration";
        

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
        
        public bool ReferenceDataToggle()
        {
            return GetBoolValueWithKey(ReferenceDataToggleKey);
        }
        
        public bool HrsEnabled()
        {
            return GetBoolValueWithKey(HrsFeatureToggleKey);
        }

        // public bool UseV2Api()
        // {
        //     return GetBoolValueWithKey(UseV2ApiToggleKey);
        // }
        
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