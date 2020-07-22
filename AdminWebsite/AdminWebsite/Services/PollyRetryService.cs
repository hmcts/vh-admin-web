using System;
using System.Threading.Tasks;
using Polly;

namespace AdminWebsite.Services
{
    public class PollyRetryService : IPollyRetryService
    {
        public async Task<TReturn> WaitAndRetryAsync<THandle, TReturn>(int retries, Func<int, TimeSpan> sleepDuration,
            Action<int> retryAction, Func<Task<TReturn>> executeFunction) where THandle : Exception
        {
            var retryPolicy = Policy
                .Handle<THandle>()
                .WaitAndRetryAsync(retries, sleepDuration, (ex, ts, index, context) => { retryAction?.Invoke(index); });

            return await retryPolicy.ExecuteAsync(executeFunction);
        }

        public async Task<TResult> WaitAndRetryAsync<THandle, TResult>(int retries, Func<int, TimeSpan> sleepDuration, Action<int> retryAction, 
            Func<TResult, bool> handleResultCondition, Func<Task<TResult>> executeFunction) where THandle : Exception
        {
            await Task.Delay(sleepDuration(0));
            
            var retryPolicy = Policy
                .Handle<THandle>()
                .OrResult(handleResultCondition)
                .WaitAndRetryAsync(retries, sleepDuration, (ex, ts, index, context) => { retryAction?.Invoke(index); });

            return await retryPolicy.ExecuteAsync(executeFunction);
        }
    }
}