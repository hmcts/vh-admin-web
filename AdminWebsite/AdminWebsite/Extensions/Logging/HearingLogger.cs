namespace AdminWebsite.Extensions.Logging
{
    using System;
    using Microsoft.Extensions.Logging;

    public static partial class HearingLogger
    {
        [LoggerMessage(
            EventId = 1000,
            Level = LogLevel.Debug,
            Message = "Attempting to clone hearing {HearingId}")]
        public static partial void LogAttemptingToCloneHearing(this ILogger logger, Guid hearingId);

        [LoggerMessage(
            EventId = 1001,
            Level = LogLevel.Warning,
            Message = "No working dates provided to clone to")]
        public static partial void LogNoWorkingDatesToClone(this ILogger logger);

        [LoggerMessage(
            EventId = 1002,
            Level = LogLevel.Debug,
            Message = "Sending request to clone hearing to Bookings API")]
        public static partial void LogSendingCloneRequest(this ILogger logger);

        [LoggerMessage(
            EventId = 1003,
            Level = LogLevel.Debug,
            Message = "Successfully cloned hearing {HearingId}")]
        public static partial void LogSuccessfullyClonedHearing(this ILogger logger, Guid hearingId);

        [LoggerMessage(
            EventId = 1004,
            Level = LogLevel.Information,
            Message = "BookNewHearing - Attempting to send booking request to Booking API")]
        public static partial void LogAttemptingToBookNewHearing(this ILogger logger);

        [LoggerMessage(
            EventId = 1005,
            Level = LogLevel.Information,
            Message = "BookNewHearing - Successfully booked hearing {HearingId}")]
        public static partial void LogSuccessfullyBookedHearing(this ILogger logger, Guid hearingId);

        [LoggerMessage(
            EventId = 1006,
            Level = LogLevel.Debug,
            Message = "Removing endpoint {EndpointId} - {EndpointDisplayName} from hearing {HearingId}")]
        public static partial void LogRemovingEndpoint(this ILogger logger, Guid endpointId, string endpointDisplayName, Guid hearingId);

        [LoggerMessage(
            EventId = 1007,
            Level = LogLevel.Debug,
            Message = "Adding endpoint {EndpointDisplayName} to hearing {HearingId}")]
        public static partial void LogAddingEndpoint(this ILogger logger, string endpointDisplayName, Guid hearingId);

        [LoggerMessage(
            EventId = 1008,
            Level = LogLevel.Debug,
            Message = "Updating endpoint {EndpointId} - {EndpointDisplayName} in hearing {HearingId}")]
        public static partial void LogUpdatingEndpoint(this ILogger logger, Guid endpointId, string endpointDisplayName, Guid hearingId);

        [LoggerMessage(
            EventId = 1009,
            Level = LogLevel.Warning,
            Message = "No hearing id found to edit")]
        public static partial void LogNoHearingIdToEdit(this ILogger logger);

        [LoggerMessage(
            EventId = 1010,
            Level = LogLevel.Debug,
            Message = "Attempting to edit hearing {HearingId}")]
        public static partial void LogAttemptingToEditHearing(this ILogger logger, Guid hearingId);

        [LoggerMessage(
            EventId = 1011,
            Level = LogLevel.Error,
            Message = "Failed to get hearing {HearingId}. Status Code {StatusCode} - Message {Message}")]
        public static partial void LogFailedToGetHearing(this ILogger logger, Guid hearingId, int statusCode, string message);

        [LoggerMessage(
            EventId = 1012,
            Level = LogLevel.Error,
            Message = "Failed to edit hearing {HearingId}. Status Code {StatusCode} - Message {Message}")]
        public static partial void LogFailedToEditHearing(this ILogger logger, Guid hearingId, int statusCode, string message);

        [LoggerMessage(
            EventId = 1013,
            Level = LogLevel.Error,
            Message = "Unexpected error trying to edit multi-day hearing")]
        public static partial void LogUnexpectedErrorEditingMultiDayHearing(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 1014,
            Level = LogLevel.Error,
            Message = "Unexpected error trying to cancel multi-day hearing")]
        public static partial void LogUnexpectedErrorCancellingMultiDayHearing(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 1015,
            Level = LogLevel.Debug,
            Message = "Hearing {HearingId} is booked. Polling for the status in BookingsApi")]
        public static partial void LogPollingHearingStatus(this ILogger logger, Guid hearingId);

        [LoggerMessage(
            EventId = 1016,
            Level = LogLevel.Error,
            Message = "Failed to confirm a hearing. {ErrorMessage}")]
        public static partial void LogFailedToConfirmHearing(this ILogger logger, string errorMessage, Exception exception);

        [LoggerMessage(
            EventId = 1017,
            Level = LogLevel.Debug,
            Message = "Updated hearing {HearingId} to booking status {BookingStatus}")]
        public static partial void LogUpdatedHearingStatus(this ILogger logger, Guid hearingId, string bookingStatus);

        [LoggerMessage(
            EventId = 1018,
            Level = LogLevel.Error,
            Message = "There was an unknown error updating status for hearing {HearingId}")]
        public static partial void LogUnknownErrorUpdatingHearingStatus(this ILogger logger, Guid hearingId, Exception exception);

        [LoggerMessage(
            EventId = 1019,
            Level = LogLevel.Error,
            Message = "Failed to update the failed status for a hearing - hearingId: {HearingId}")]
        public static partial void LogFailedToUpdateFailedStatus(this ILogger logger, Guid hearingId, Exception exception);

        [LoggerMessage(
            EventId = 1020,
            Level = LogLevel.Error,
            Message = "BookNewHearing - There was a problem saving the booking. Status Code {StatusCode} - Message {Message}")]
        public static partial void LogBookNewHearingError(this ILogger logger, int statusCode, string message, Exception exception);

        [LoggerMessage(
            EventId = 1021,
            Level = LogLevel.Error,
            Message = "BookNewHearing - Failed to save hearing - {Message} - for request: {RequestBody}")]
        public static partial void LogBookNewHearingFailed(this ILogger logger, string message, string requestBody, Exception exception);

        [LoggerMessage(
            EventId = 1022,
            Level = LogLevel.Error,
            Message = "There was a problem rebooking the hearing. Status Code {StatusCode} - Message {Message}")]
        public static partial void LogRebookHearingError(this ILogger logger, int statusCode, string message, Exception exception);

        [LoggerMessage(
            EventId = 1023,
            Level = LogLevel.Error,
            Message = "There was a problem cloning the booking. Status Code {StatusCode} - Message {Message}")]
        public static partial void LogCloneHearingError(this ILogger logger, int statusCode, string message, Exception exception);

        [LoggerMessage(
            EventId = 1024,
            Level = LogLevel.Error,
            Message = "Failed to confirm a hearing. {ErrorMessage}")]
        public static partial void LogConfirmHearingError(this ILogger logger, string errorMessage, Exception exception);
    
        [LoggerMessage(
            EventId = 1025,
            Level = LogLevel.Error,
            Message = "Failed to get the booking created status, possibly the conference was not created - hearingId: {hearingId}")]
        public static partial void LogFailedToGetBookingCreatedStatusError(this ILogger logger, Guid hearingId, Exception exception);
    }
}