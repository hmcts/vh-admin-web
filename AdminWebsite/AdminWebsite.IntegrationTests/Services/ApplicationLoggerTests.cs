using System;
using System.Collections.Generic;
using System.Security.Claims;
using AdminWebsite.Services;
using NUnit.Framework;

namespace AdminWebsite.IntegrationTests.Services
{
    /// <summary>
    /// Tests for logger class
    /// </summary>
    /// <remarks>
    /// Though difficult to reliably test that the TelemetryClient does what is expected.
    /// At the very least this class will test any possibly failure within the logic of the methods.
    /// </remarks>
    public class ApplicationLoggerTests
    {
        [Test]
        public void Should_trace_without_failure()
        {
            ApplicationLogger.Trace("Category", "Title", "Information");
            Assert.IsTrue(true);
        }
        
        [Test]
        public void Should_trace_without_or_without_properties()
        {
            ApplicationLogger.TraceWithProperties("Category", "Title", "User", null);
            ApplicationLogger.TraceWithProperties("Category", "Title", "User", new Dictionary<string, string>{ {"property", "value"} });
            Assert.IsTrue(true);
        }

        [Test]
        public void Should_trace_without_or_without_object()
        {
            ApplicationLogger.TraceWithObject("Category", "Title", "User", null);
            dynamic someObject = new
            {
                Property = "value"
            };
            ApplicationLogger.TraceWithObject("Category", "Title", "User", someObject);
            Assert.IsTrue(true);
        }

        [Test]
        public void Should_throw_exception_if_trying_to_trace_null_exception()
        {
            Assert.Throws<ArgumentNullException>(
                () => ApplicationLogger.TraceException("Category", "Title", null, null));
        }
        
        [Test]
        public void Should_trace_exception()
        {
            var exception = new Exception("Test");
            var user = new ClaimsPrincipal();
            var properties = new Dictionary<string, string> {{"property", "value"}};
            ApplicationLogger.TraceException("Category", "Title", exception, user, null);
            ApplicationLogger.TraceException("Category", "Title", exception, null, null);
            ApplicationLogger.TraceException("Category", "Title", exception, null, properties);
            ApplicationLogger.TraceException("Category", "Title", exception, null);
            Assert.IsTrue(true);
        }

        [Test]
        public void Should_trace_event()
        {
            var properties = new Dictionary<string, string> {{"property", "value"}};
            ApplicationLogger.TraceEvent("Title", properties);
            ApplicationLogger.TraceEvent("Title", null);
            Assert.IsTrue(true);
        }

        [Test]
        public void Should_trace_result()
        {
            ApplicationLogger.TraceRequest("Operation", DateTimeOffset.Now, TimeSpan.FromSeconds(2), "200", true);
            Assert.IsTrue(true);
        }
    }
}