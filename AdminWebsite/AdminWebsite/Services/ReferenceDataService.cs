using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Responses;
using Microsoft.Extensions.Caching.Memory;

namespace AdminWebsite.Services;

public interface IReferenceDataService
{
    Task InitialiseCache();
    Task<List<CaseTypeResponseV2>> GetNonDeletedCaseTypesAsync(CancellationToken cancellationToken = default);
    Task<List<InterpreterLanguagesResponse>> GetInterpreterLanguagesAsync(CancellationToken cancellationToken = default);
    Task<List<HearingVenueResponse>> GetHearingVenuesAsync(CancellationToken cancellationToken = default);
    Task<List<HearingRoleResponseV2>> GetHearingRolesAsync(CancellationToken cancellationToken = default);
}

public class ReferenceDataService(IBookingsApiClient bookingsApiClient, IMemoryCache memoryCache) : IReferenceDataService
{
    private const string InterpreterLanguagesKey = "RefData_InterpreterLanguages";
    private const string HearingVenuesKey = "RefData_HearingVenues";
    private const string CaseTypesKey = "RefData_CaseTypes";
    private const string HearingRolesKey = "RefData_HearingRoles";
    public async Task InitialiseCache()
    {
        await GetInterpreterLanguagesAsync();
        await GetHearingVenuesAsync();
        await GetNonDeletedCaseTypesAsync();
        await GetHearingRolesAsync();
    }

    public async Task<List<CaseTypeResponseV2>> GetNonDeletedCaseTypesAsync(
        CancellationToken cancellationToken = default)
    {
        return await GetOrCreateCacheAsync(CaseTypesKey, async token =>
        {
            var caseTypes = await bookingsApiClient.GetCaseTypesV2Async(includeDeleted: false, token);
            return caseTypes.ToList();
        }, cancellationToken);
    }

    public async Task<List<InterpreterLanguagesResponse>> GetInterpreterLanguagesAsync(CancellationToken cancellationToken = default)
    {
        return await GetOrCreateCacheAsync(InterpreterLanguagesKey, async token =>
        {
            var interpreterLanguages = await bookingsApiClient.GetAvailableInterpreterLanguagesAsync(token);
            return interpreterLanguages.ToList();
        }, cancellationToken);
    }

    public async Task<List<HearingVenueResponse>> GetHearingVenuesAsync(CancellationToken cancellationToken = default)
    {
        return await GetOrCreateCacheAsync(HearingVenuesKey, async token =>
        {
            var hearingVenues = await bookingsApiClient.GetHearingVenuesAsync(excludeExpiredVenue: true, token);
            return hearingVenues.ToList();
        }, cancellationToken);
    }

    public async Task<List<HearingRoleResponseV2>> GetHearingRolesAsync(CancellationToken cancellationToken = default)
    {
        return await GetOrCreateCacheAsync(HearingRolesKey, async token =>
        {
            var hearingRoles = await bookingsApiClient.GetHearingRolesAsync(token);
            return hearingRoles.ToList();
        }, cancellationToken);
        
    }

    

    private async Task<List<T>> GetOrCreateCacheAsync<T>(string cacheKey,
        Func<CancellationToken, Task<List<T>>> fetchFunction, CancellationToken cancellationToken)
    {
        return await memoryCache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpiration = DateTimeOffset.UtcNow.AddHours(3);
            return await fetchFunction(cancellationToken);
        });
    }
}