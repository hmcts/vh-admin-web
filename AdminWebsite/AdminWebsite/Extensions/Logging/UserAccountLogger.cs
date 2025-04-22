namespace AdminWebsite.Extensions.Logging
{
    using System;
    using Microsoft.Extensions.Logging;

    public static partial class UserAccountLogger
    {
        [LoggerMessage(
            EventId = 3000,
            Level = LogLevel.Warning,
            Message = "AD User not found for username {Username}")]
        public static partial void LogAdUserNotFound(this ILogger logger, string username);

        [LoggerMessage(
            EventId = 3001,
            Level = LogLevel.Error,
            Message = "Unhandled error getting an AD user by username {Username}")]
        public static partial void LogUnhandledErrorGettingAdUser(this ILogger logger, string username, Exception exception);

        [LoggerMessage(
            EventId = 3002,
            Level = LogLevel.Debug,
            Message = "Attempting to get all judge accounts")]
        public static partial void LogAttemptingToGetAllJudgeAccounts(this ILogger logger);

        [LoggerMessage(
            EventId = 3003,
            Level = LogLevel.Error,
            Message = "Failed to get user in User API. Status Code {StatusCode} - Message {Message}")]
        public static partial void LogFailedToGetUserInUserApi(this ILogger logger, int statusCode, string message, Exception exception);

        [LoggerMessage(
            EventId = 3004,
            Level = LogLevel.Error,
            Message = "Failed to get person in User API. Status Code {StatusCode} - Message {Message}")]
        public static partial void LogFailedToGetPersonInUserApi(this ILogger logger, int statusCode, string message, Exception exception);

        [LoggerMessage(
            EventId = 3005,
            Level = LogLevel.Warning,
            Message = "User not found. Status Code {StatusCode} - Message {Message}")]
        public static partial void LogUserNotFoundInUserApi(this ILogger logger, int statusCode, string message);

    }
}