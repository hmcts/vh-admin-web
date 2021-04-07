using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using AdminWebsite.Services.Models;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;

namespace AdminWebsite.Services
{
    public class UkPublicHolidayRetriever : IPublicHolidayRetriever
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _memoryCache;
        private readonly string holidayKey = "public_holidays";

        public UkPublicHolidayRetriever(HttpClient httpClient, IMemoryCache memoryCache)
        {
            _httpClient = httpClient;
            _memoryCache = memoryCache;
        }

        public async Task<List<PublicHoliday>> RetrieveUpcomingHolidays()
        {
            return GetHolidaysFromCache() ?? await GetHolidaysFromApi();
        }

        private List<PublicHoliday> GetHolidaysFromCache()
        {
            return !_memoryCache.TryGetValue(holidayKey, out List<PublicHoliday> holidays) ? null : holidays;
        }
        
        private async Task<List<PublicHoliday>> GetHolidaysFromApi()
        {
            var holidays = new List<PublicHoliday>();
            var ukHolidaysUri = @"https://www.gov.uk/bank-holidays.json";
            
            var response = await _httpClient.GetAsync(ukHolidaysUri);
            response.EnsureSuccessStatusCode();
            
            if (!response.IsSuccessStatusCode) return holidays;
            var json = await response.Content.ReadAsStringAsync();
            var ukHolidays = JsonConvert.DeserializeObject<UkHolidaysResponse>(json);
            var englandAndWales = ukHolidays.EnglandAndWales.Events;
            holidays = englandAndWales.Where(x => x.Date >= DateTime.Today).ToList();

            _memoryCache.Set(holidayKey, holidays, DateTime.UtcNow.AddHours(1));
            
            return holidays;
        }
    }
}