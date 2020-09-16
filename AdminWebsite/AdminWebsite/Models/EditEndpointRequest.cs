using System;

namespace AdminWebsite.Models
{
    public class EditEndpointRequest
    {
        /// <summary>
        ///     Endpoint Id.
        /// </summary>
        public Guid? Id { get; set; }
        /// <summary>
        ///     The display name for the endpoint
        /// </summary>
        public string DisplayName { get; set; }
        /// <summary>
        ///     The username of the participant
        /// </summary>
        public string DefenceAdvocateUsername { get; set; }
        /// <summary>
        ///     The defence advocate Id
        /// </summary>
        public Guid? DefenceAdvocateId { get; set; }
    }
}
