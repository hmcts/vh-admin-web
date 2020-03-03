using Microsoft.ApplicationInsights.Channel;
using Microsoft.ApplicationInsights.Extensibility;

namespace AdminWebsite.Services
{
    /// <summary>
    /// Class to initialize the telemetry with the role of the application
    /// </summary>
    public class CloudRoleNameInitializer : ITelemetryInitializer
    {
        private const string ROLE_NAME = "vh-admin-web";

        public void Initialize(ITelemetry telemetry)
        {
            telemetry.Context.Cloud.RoleName = ROLE_NAME;
        }
    }
}