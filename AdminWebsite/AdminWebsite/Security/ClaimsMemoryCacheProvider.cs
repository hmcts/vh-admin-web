using AdminWebsite.Services.Models;
using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace AdminWebsite.Security
{
    public interface IClaimsCacheProvider
    {
        Task<UserRole> GetOrAddAsync(string key, Func<string, Task<UserRole>> valueFactory);
    }

    public class MemoryClaimsCacheProvider : IClaimsCacheProvider
    {
        private readonly ConcurrentDictionary<string, Task<UserRole>> _cache;

        public MemoryClaimsCacheProvider()
        {
            _cache = new ConcurrentDictionary<string, Task<UserRole>>();
        }

        public async Task<UserRole> GetOrAddAsync(string key, Func<string, Task<UserRole>> valueFactory)
        {
            return await _cache.GetOrAdd(key, valueFactory);
        }
    }
}