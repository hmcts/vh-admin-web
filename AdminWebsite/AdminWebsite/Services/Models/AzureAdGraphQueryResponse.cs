using System.Collections.Generic;
using Newtonsoft.Json;

namespace AdminWebsite.Services.Models
{
    public class AzureAdGraphQueryResponse<T>
    {
        [JsonProperty("@odata.metadata")]
        public string Context { get; set; }

        [JsonProperty("value")]
        public IList<T> Value { get; set; }
    }

    public class AzureAdGraphUserResponse
    {
        public string ObjectId { get; set; }
        public string UserPrincipalName { get; set; }
        public string DisplayName { get; set; }
    }
}
