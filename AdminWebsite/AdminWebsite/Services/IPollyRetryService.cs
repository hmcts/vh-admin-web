using System;
using System.Threading.Tasks;

namespace AdminWebsite.Services
{
    public interface IPollyRetryService
    {
        Task<TReturn> WaitAndRetryAsync<THandle, TReturn>(int retries, Func<int, TimeSpan> sleepDuration, Action<int> retryAction,
            Func<Task<TReturn>> executeFunction) where THandle : Exception;

        Task<TResult> WaitAndRetryAsync<THandle, TResult>(int retries, Func<int, TimeSpan> sleepDuration, Action<int> retryAction,
            Func<TResult, bool> handleResultCondition, Func<Task<TResult>> executeFunction) where THandle : Exception;
    }
}