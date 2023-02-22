namespace AdminWebsite.Contracts.Responses
{
    public class ExistingJusticeUserResponse
    {
        /// <summary>
        /// The username for the existing user
        /// </summary>
        public string Username { get; set; }
        /// <summary>
        /// The first name of the existing user
        /// </summary>
        public string FirstName { get; set; }
        /// <summary>
        /// The last name of the existing user
        /// </summary>
        public string LastName { get; set; }
        
        /// <summary>
        /// The contact email of the existing user
        /// </summary>
        public string ContactEmail { get; set; }
        
        /// <summary>
        /// The contact telephone number of the existing user
        /// </summary>
        public string Telephone { get; set; }
    }
}