using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace AdminWebsite.Contracts.Requests
{
    public class BookingSearchRequest
    {
        private const int DefaultLimit = 100;

        [JsonProperty("cursor")]
        public string Cursor { get; set; }

        [JsonProperty("limit")]
        public int Limit { get; set; } = DefaultLimit;

        [JsonProperty("caseNumber")]
        public string CaseNumber { get; set; } = string.Empty;

        [JsonProperty("venueIds")]
        public List<int> VenueIds { get; set; } = null;

        [JsonProperty("caseTypes")]
        public List<string> CaseTypes { get; set; } = null;

        [JsonProperty("startDate")]
        public DateTime? StartDate { get; set; } = null;

        [JsonProperty("endDate")]
        public DateTime? EndDate { get; set; } = null;

        [JsonProperty("lastName")]
        public string LastName { get; set; } = string.Empty;

        [JsonProperty("noJudge")]
        public bool Nojudge { get; set; } = false;
    }
}
