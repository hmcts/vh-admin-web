namespace AdminWebsite.Services.Models
{
    /// <summary>
    ///     ConflictResponse
    /// </summary>
    public class ConflictResponse
    {
        /// <summary>
        ///     The conflict message
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        ///     The conflict code
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        ///     The username returned from user-api
        /// </summary>
        public string Username { get; set; }
    }
}
