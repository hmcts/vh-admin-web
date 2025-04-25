namespace AdminWebsite.Extensions.Logging
{
    using System;
    using Microsoft.Extensions.Logging;

    public static partial class ReferenceDataLogger
    {
        [LoggerMessage(
            EventId = 2000,
            Level = LogLevel.Information,
            Message = "Static ref data (languages, venues, case types and hearing roles) cached")]
        public static partial void LogStaticRefDataCached(this ILogger logger);

        
    }
}