using System;
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
        public bool ReferenceDataToggle();
        public bool UseV2Api();
        public bool HrsEnabled();
        public bool AudioSearchEnabled();
        public bool UsePostMay2023Template();
    }

    public class FeatureToggles : IFeatureToggles
    {
        private readonly ILdClient _ldClient;
        private readonly Context _context;
        private const string LdUser = "vh-admin-web";
        private const string BookAndConfirmToggleKey = "Book_and_Confirm";
        private const string Dom1EnabledToggleKey = "dom1";
        private const string ReferenceDataToggleKey = "reference-data";
        private const string UseV2ApiToggleKey = "use-bookings-api-v2";
        private const string HrsFeatureToggleKey = "hrs-integration";
        private const string AudioSearchToggleKey = "hide-audio-search-tile";
        private const string UsePostMay2023TemplateKey = "notify-post-may-2023-templates";
        

        public FeatureToggles(string sdkKey, string environmentName)
        {
            var config = LaunchDarkly.Sdk.Server.Configuration.Builder(sdkKey)
                .Logging(Components.Logging(Logs.ToWriter(Console.Out)).Level(LogLevel.Warn)).Build();
            _context = Context.Builder(LdUser).Name(environmentName).Build();
            _ldClient = new LdClient(config);
        }

        public bool BookAndConfirmToggle()
        {
            return GetBoolValueWithKey(BookAndConfirmToggleKey);
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

        public bool AudioSearchEnabled()
        {
            return GetBoolValueWithKey(AudioSearchToggleKey);
        }

        public bool UseV2Api()
        {
            return false;
            //return GetBoolValueWithKey(UseV2ApiToggleKey);
        }
        
        public bool UsePostMay2023Template()
        {
            return GetBoolValueWithKey(UsePostMay2023TemplateKey);
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