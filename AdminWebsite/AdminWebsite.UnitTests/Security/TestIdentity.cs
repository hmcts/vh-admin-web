using System.Security.Claims;

namespace AdminWebsite.UnitTests.Security
{
    /// <summary>
    /// Mock class to ease testing of identity services
    /// </summary>
    public class TestIdentity : ClaimsIdentity
    {
        public TestIdentity(params Claim[] claims) : base(claims)
        {
        }
    }
}