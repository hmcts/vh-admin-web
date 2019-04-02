using System.Security.Claims;

namespace Testing.Common.Security
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