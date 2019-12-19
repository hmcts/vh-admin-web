namespace AdminWebsite.Services
{
    public enum TraceCategory
    {
        /// <summary>
        /// Trace log relating to a service dependency, api or such
        /// </summary>
        Dependency,

        /// <summary>
        /// Errors that are caught globally and could not be handled 
        /// </summary>
        UnhandledError,

        /// <summary>
        /// Traces related to authentication to this or other services
        /// </summary>
        ServiceAuthentication
    }
}