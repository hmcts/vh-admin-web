using AdminWebsite.Configuration;

namespace AdminWebsite.Security.Authentication
{
    public class VhAadScheme : AadSchemeBase
    {
        public VhAadScheme(AzureAdConfiguration azureAdConfiguration): base(azureAdConfiguration)
        {
        }

        public override AuthProvider Provider => AuthProvider.VHAAD;
    }
}
