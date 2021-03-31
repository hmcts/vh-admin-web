using System.Collections.Generic;
using System.Threading.Tasks;
using AdminWebsite.Services.Models;

namespace AdminWebsite.Services
{
    public interface IPublicHolidayRetriever
    {
        Task<List<PublicHoliday>> RetrieveUpcomingHolidays();
    }
}