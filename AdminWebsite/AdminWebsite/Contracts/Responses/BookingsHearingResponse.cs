using System;

namespace AdminWebsite.Contracts.Responses
{
    public partial class BookingsHearingResponse
    {
        public long? Hearing_id { get; set; }
        public string Hearing_number { get; set; }
        public string Hearing_name { get; set; }
        public DateTime? Scheduled_date_time { get; set; }
        public int? Scheduled_duration { get; set; }
        public string Hearing_type_name { get; set; }
        public string Court_room { get; set; }
        public string Court_address { get; set; }
        public string Judge_name { get; set; }
        public string Created_by { get; set; }
        public DateTime? Created_date { get; set; }
        public string Last_edit_by { get; set; }
        public DateTime? Last_edit_date { get; set; }
        public DateTime? Hearing_date { get; set; }

    }
}