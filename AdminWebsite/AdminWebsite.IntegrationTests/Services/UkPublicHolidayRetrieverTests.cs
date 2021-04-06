using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using AdminWebsite.Services;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using NUnit.Framework;

namespace AdminWebsite.IntegrationTests.Services
{
    public class UkPublicHolidayRetrieverTests
    {
        private UkPublicHolidayRetriever _sut;
        private HttpClient _httpClient;

        [SetUp]
        public void Setup()
        {
            _httpClient = new HttpClient();
            _sut = new UkPublicHolidayRetriever(_httpClient, new MemoryCache(new MemoryCacheOptions()));
        }

        [TearDown]
        public void TearDown()
        {
            _httpClient.Dispose();
        }
        
        [Test]
        public async Task should_return_upcoming_holidays()
        {
            var result = await _sut.RetrieveUpcomingHolidays();

            result.Any(x => x.Date < DateTime.Today).Should().BeFalse();
        }
    }
}