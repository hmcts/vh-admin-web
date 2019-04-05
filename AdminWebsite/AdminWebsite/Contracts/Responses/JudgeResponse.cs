namespace AdminWebsite.Contracts.Responses
{
    /// <summary>
    /// A judge existing in the system
    /// </summary>
    public class JudgeResponse
    {
        /// <summary>
        /// Judge first name
        /// </summary>
        public string FirstName { get; set; }
        
        /// <summary>
        /// Judge last name
        /// </summary>
        public string LastName { get; set; }
        
        /// <summary>
        /// Judge display name as in the identity system
        /// </summary>
        public string DisplayName { get; set; }
        
        /// <summary>
        /// Judge username/email
        /// </summary>
        public string Email { get; set; }
    }
}