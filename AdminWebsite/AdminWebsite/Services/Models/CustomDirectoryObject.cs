using Newtonsoft.Json;

namespace AdminWebsite.Services.Models
{
    public class CustomDirectoryObject
    {
        [JsonProperty(PropertyName = "@odata.id")]
        public string ObjectDataId { get; set; }
    }
}
