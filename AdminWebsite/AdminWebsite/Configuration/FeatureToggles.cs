// using System;
// using LaunchDarkly.Logging;
// using LaunchDarkly.Sdk;
// using LaunchDarkly.Sdk.Server;
// using LaunchDarkly.Sdk.Server.Interfaces;using System;

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
        public bool Dom1EnabledV2();
    }
    
    public class FeatureToggles : IFeatureToggles
    {
        private readonly ILdClient _ldClient;
        private readonly Context _context;
        private const string LdUser = "vh-admin-web";
        private const string BookAndConfirmToggleKey = "Book_and_Confirm";
        private const string Dom1EnabledToggleKey = "dom1";
        private const string Dom1EnabledV2ToggleKey = "Dom1Feature";
        public FeatureToggles(string sdkKey, string environmentName)
        {
            var config = LaunchDarkly.Sdk.Server.Configuration.Builder(sdkKey)
                .Logging(Components.Logging(Logs.ToWriter(Console.Out)).Level(LogLevel.Warn)).Build();
            _context = Context.Builder(LdUser).Name(environmentName).Build();
            _ldClient = new LdClient(config);
        }

        public bool BookAndConfirmToggle() => _ldClient.BoolVariation(BookAndConfirmToggleKey, _context);
        public bool Dom1Enabled()
        {
            if (!_ldClient.Initialized)
            {
                throw new InvalidOperationException("LaunchDarkly client not initialized");
            }
            return _ldClient.BoolVariation(Dom1EnabledToggleKey, _context);
        }
        
        public bool Dom1EnabledV2()
        {
            if (!_ldClient.Initialized)
            {
                throw new InvalidOperationException("LaunchDarkly client not initialized");
            }
            return _ldClient.BoolVariation(Dom1EnabledV2ToggleKey, _context);
        }
    }
}