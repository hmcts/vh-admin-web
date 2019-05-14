using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AdminWebsite.Services
{
    public interface IClaimsCacheProvider
    {
        Task<IEnumerable<Claim>> GetOrAdd(string key, Func<string, Task<IEnumerable<Claim>>> valueFactory);
    }

    public class MemoryClaimsCacheProvider : IClaimsCacheProvider
    {
        private readonly ConcurrentDictionary<string, Task<IEnumerable<Claim>>> _cache;

        public MemoryClaimsCacheProvider()
        {
            _cache = new ConcurrentDictionary<string, Task<IEnumerable<Claim>>>();    
        }

        public async Task<IEnumerable<Claim>> GetOrAdd(string key, Func<string, Task<IEnumerable<Claim>>> valueFactory)
        {
            return await _cache.GetOrAdd(key, valueFactory);
        }
    }
}