using LaunchDarkly.Sdk;
using LaunchDarkly.Sdk.Server;
using LaunchDarkly.Sdk.Server.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AdminWebsite.Configuration
{
    public interface IFeatureToggles
    {
        public bool BookAndConfirmToggle();
    }
    
    public class FeatureToggles : IFeatureToggles
    {
        private readonly ILdClient _ldClient;
        private readonly User _user;
        private const string LdUser = "vh-admin-web";
        private const string SDKConfigKey = "SDK-Key";
        private const string BookAndConfirmToggleKey = "Book_and_Confirm";
        public FeatureToggles(IConfiguration config)
        {
            _ldClient = new LdClient(config[SDKConfigKey]);
            _user = LaunchDarkly.Sdk.User.WithKey(LdUser);
        }

        public bool BookAndConfirmToggle() => _ldClient.BoolVariation(BookAndConfirmToggleKey, _user);
    }
}