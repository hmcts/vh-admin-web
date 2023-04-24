using AdminWebsite.Configuration;

namespace AdminWebsite.Security.Authentication
{
    public class Dom1Scheme : AadSchemeBase
    {
        public Dom1Scheme(Dom1AdConfiguration dom1AdConfiguration): base(dom1AdConfiguration)
        {
        }

        public override AuthProvider Provider => AuthProvider.Dom1;
    }
}
