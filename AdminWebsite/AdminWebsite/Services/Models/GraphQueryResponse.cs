using System.Collections.Generic;
using Microsoft.Graph;
using Newtonsoft.Json;

namespace AdminWebsite.Services.Models
{
    public class GraphQueryResponse
    {
        [JsonProperty("@odata.context")]
        public string Context { get; set; }

        [JsonProperty("value")]
        public IList<Group> Value { get; set; }
    }
}
