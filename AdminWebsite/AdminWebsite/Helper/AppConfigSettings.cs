namespace AdminWebsite.Helper
{
    /// <summary>
    ///     Application Settings. 
    /// </summary>
    public class AppConfigSettings
    {
        /// <summary>
        ///     Retry interval to update user information.
        /// </summary>
        public int APIFailureRetryTimeoutSeconds { get; set; }
        /// <summary>
        ///     Flag to determine the list of judges to be displayed (Live/ Live and Test).
        /// </summary>
        public bool IsLive { get; set; }
    }
}
