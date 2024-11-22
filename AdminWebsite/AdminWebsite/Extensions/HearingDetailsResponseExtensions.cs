using AdminWebsite.Contracts.Responses;

namespace AdminWebsite.Extensions;

public static class HearingDetailsResponseExtensions
{
    public static bool HasScheduleAmended(this HearingDetailsResponse hearing, HearingDetailsResponse anotherHearing)

    {
        return hearing.ScheduledDateTime.Ticks != anotherHearing.ScheduledDateTime.Ticks;
    }
}