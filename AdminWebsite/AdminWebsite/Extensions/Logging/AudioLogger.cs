namespace AdminWebsite.Extensions.Logging
{
    using System;
    using Microsoft.Extensions.Logging;

    public static partial class AudioLogger
    {
        [LoggerMessage(
            EventId = 4000,
            Level = LogLevel.Information,
            Message = "Getting audio recording for hearing: {HearingId}")]
        public static partial void LogAudioRecordingRetrieved(this ILogger logger, Guid hearingId);
       
    }
}