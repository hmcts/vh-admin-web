using System;
using System.Threading.Tasks;
using AdminWebsite.Models;
using AdminWebsite.Services;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Services
{
    public class PollyRetryServiceTests
    {
        private readonly IPollyRetryService _pollyRetryService;

        public PollyRetryServiceTests()
        {
            _pollyRetryService = new PollyRetryService();
        }

        [Test]
        public void WaitAndRetryAsync_Retries_On_Exception()
        {
            var retryInvoked = false;

            _pollyRetryService.WaitAndRetryAsync<Exception, object>
            (
                3, i => TimeSpan.FromMilliseconds(1), retryAttempt => retryInvoked = true,
#pragma warning disable S3626 // Jump statements should not be redundant
                () => throw new Exception("What")
#pragma warning restore S3626 // Jump statements should not be redundant
            );

            Assert.True(retryInvoked);
        }

        [Test]
        public async Task WaitAndRetryAsync_Does_Not_Retry()
        {
            var retryInvoked = false;

            var result = await _pollyRetryService.WaitAndRetryAsync<Exception, object>
            (
                3, i => TimeSpan.FromMilliseconds(1), retryAttempt => retryInvoked = true,
                () => Task.FromResult<object>("returned")
            );

            Assert.False(retryInvoked);
            result.Should().Be("returned");
        }

        [Test]
        public async Task WaitAndRetryAsync_With_Result_Retries_On_Exception()
        {
            var retryInvoked = false;

            try
            {
                await _pollyRetryService.WaitAndRetryAsync<Exception, UpdateBookingStatusResponse>
                (
                    3, i => TimeSpan.FromMilliseconds(1), retryAttempt => retryInvoked = true,
                    x => !x.Success,
#pragma warning disable S3626 // Jump statements should not be redundant
                    () => throw new Exception("What")
#pragma warning restore S3626 // Jump statements should not be redundant
                );
            }
            catch
            {
                Assert.True(retryInvoked);
            }
        }

        [Test]
        public async Task WaitAndRetryAsync_With_Result_Retries_On_Failed_Result()
        {
            var retryInvoked = false;

            await _pollyRetryService.WaitAndRetryAsync<Exception, UpdateBookingStatusResponse>
            (
                3, i => TimeSpan.FromMilliseconds(1), retryAttempt => retryInvoked = true,
                x => !x.Success,
                () => Task.FromResult(new UpdateBookingStatusResponse {Success = false})
            );

            Assert.True(retryInvoked);
        }

        [Test]
        public async Task WaitAndRetryAsync_With_Result_Does_Not_Retry()
        {
            var retryInvoked = false;

            var result = await _pollyRetryService.WaitAndRetryAsync<Exception, UpdateBookingStatusResponse>
            (
                3, i => TimeSpan.FromMilliseconds(1), retryAttempt => retryInvoked = true,
                x => !x.Success,
                () => Task.FromResult(new UpdateBookingStatusResponse {Success = true})
            );

            Assert.False(retryInvoked);
            
            result.Success.Should().BeTrue();
        }
    }
}