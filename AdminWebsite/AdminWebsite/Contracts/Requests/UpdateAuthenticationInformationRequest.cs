﻿using Newtonsoft.Json;
using System.Collections.Generic;

namespace AdminWebsite.Contracts.Requests
{
    /// <summary>
    /// Request to update a users email address in active directory
    /// </summary>
    public class UpdateAuthenticationInformationRequest
    {
        /// <summary>
        /// The list of personal emails to set
        /// </summary>
        [JsonProperty("otherMails")]
        public List<string> OtherMails { get; set; }
    }
}
