using System;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace AdminWebsite.Contracts.Requests
{
    /// <summary>
    /// Request to update a users email address in active directory
    /// </summary>
    [Obsolete("Review this class and remove if not needed")]
    [ExcludeFromCodeCoverage]
    public class UpdateAuthenticationInformationRequest
    {
        /// <summary>
        /// The list of personal emails to set
        /// </summary>
        [JsonProperty("otherMails")]
        public List<string> OtherMails { get; set; }
    }
}
