using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using AdminWebsite.Helper;
using AdminWebsite.Services;

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

        public async Task<IEnumerable<Claim>> BuildAsync(string username, string cacheKey)
        {
            return await _claimsCacheProvider
                .GetOrAdd(cacheKey, async key => 
                    new AdministratorRoleClaimsHelper(await _userAccountService.GetUserGroupDataAsync(username))
                        .GetAdministratorClaims());
        }
    }
}