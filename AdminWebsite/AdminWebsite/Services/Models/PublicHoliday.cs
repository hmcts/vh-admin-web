using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace AdminWebsite.Services.Models
{
    class UkHolidaysResponse
    {
        [JsonProperty("england-and-wales")]
        public Country EnglandAndWales { get; set; }
        
        [JsonProperty("scotland")]
        public Country Scotland { get; set; }

        [JsonProperty("northern-ireland")]
        public Country NorthernIreland { get; set; }
    }

    class Country
    {
        [JsonProperty("events")]
        public List<PublicHoliday> Events { get; set; }
    }
    public class PublicHoliday
    {
        [JsonProperty("title")]
        public string Title { get; set; }
        [JsonProperty("date")]
        public DateTime Date { get; set; }
    }
}