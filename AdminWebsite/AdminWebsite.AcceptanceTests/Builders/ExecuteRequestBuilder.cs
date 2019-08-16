using System.Net;
using AdminWebsite.AcceptanceTests.Contexts;
using FluentAssertions;

namespace AdminWebsite.AcceptanceTests.Builders
{
    public class ExecuteRequestBuilder
    {
        private TestContext _context;
        private HttpStatusCode _status;

        public ExecuteRequestBuilder WithContext(TestContext context)
        {
            _context = context;
            return this;
        }

        public ExecuteRequestBuilder WithExpectedStatusCode(HttpStatusCode status)
        {
            _status = status;
            return this;
        }

        public void SendToBookingsApi()
        {
            _context.Response = _context.BookingsApiClient().Execute(_context.Request);
            GetTheResponse();
            VerifyTheResponse();
        }

        private void GetTheResponse()
        {
            if (_context.Response.Content != null)
                _context.Json = _context.Response.Content;
        }

        private void VerifyTheResponse()
        {
            _context.Response.StatusCode.Should().Be(_status);
        }
    }
}
