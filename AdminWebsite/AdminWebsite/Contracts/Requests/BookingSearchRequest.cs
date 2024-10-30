using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace AdminWebsite.Contracts.Requests
{
    public class BookingSearchRequest
    {
        public BookingSearchRequest()
        {
            CaseTypes = new List<string>();
            SelectedUsers = new List<Guid>();
            VenueIds = new List<int>();
        }
        private const int DefaultLimit = 100;

        [JsonProperty("cursor")]
        public string Cursor { get; set; }

        [JsonProperty("limit")]
        [Required]
        public int Limit { get; set; } = DefaultLimit;

        [JsonProperty("caseNumber")]
        public string CaseNumber { get; set; } = string.Empty;

        [JsonProperty("venueIds")]
        public List<int> VenueIds { get; set; }

        [JsonProperty("caseTypes")]
        public List<string> CaseTypes { get; set; }
        
        [JsonProperty("selectedUsers")]
        public List<Guid> SelectedUsers { get; set; }

        [JsonProperty("startDate")]
        public DateTime? StartDate { get; set; }

        [JsonProperty("endDate")]
        public DateTime? EndDate { get; set; }

        [JsonProperty("lastName")]
        public string LastName { get; set; } = string.Empty;

        [JsonProperty("noJudge")]
        [Required]
        [JsonRequired]
        public bool Nojudge { get; set; }
        
        [JsonProperty("noAllocated")]
        [Required]
        [JsonRequired]
        public bool NoAllocated { get; set; }
    }
}
