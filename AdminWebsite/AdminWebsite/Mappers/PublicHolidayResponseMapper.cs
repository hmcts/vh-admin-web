using AdminWebsite.Contracts.Responses;
using AdminWebsite.Services.Models;

namespace AdminWebsite.Mappers
{
    public static class PublicHolidayResponseMapper
    {
        public static PublicHolidayResponse MapFrom(PublicHoliday publicHoliday)
        {
            return new PublicHolidayResponse
            {
                Date = publicHoliday.Date,
                Name = publicHoliday.Title
            };
        }
    }
}