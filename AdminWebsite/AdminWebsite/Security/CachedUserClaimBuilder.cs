using AdminWebsite.Helper;
using AdminWebsite.Services;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AdminWebsite.Security
{
    public interface ICachedUserClaimBuilder
    {
        Task<IEnumerable<Claim>> BuildAsync(string username, string cacheKey);
    }

    public class CachedUserClaimBuilder : ICachedUserClaimBuilder
    {
        private readonly IClaimsCacheProvider _claimsCacheProvider;
        private readonly IUserAccountService _userAccountService;

        public CachedUserClaimBuilder(IClaimsCacheProvider claimsCacheProvider, IUserAccountService userAccountService)
        {
            _claimsCacheProvider = claimsCacheProvider;
            _userAccountService = userAccountService;
        }

        //We cache the task of UserRole because we only want the async method to get user role once 
        public async Task<IEnumerable<Claim>> BuildAsync(string username, string cacheKey)
        {
            var userRole = await _claimsCacheProvider.GetOrAddAsync
            (
                cacheKey, async key => await _userAccountService.GetUserRoleAsync(username)
            );

            return new AdministratorRoleClaims(userRole).Claims;
        }
    }
}