using System;

namespace AdminWebsite.Models
{
    /// <summary>
    /// A single booked hearing
    /// </summary>
    public class BookingsHearingResponse
    {
        /// <summary>
        /// Unique hearing identifier
        /// </summary>
        public long? Hearing_id { get; set; }
        
        /// <summary>
        /// The lead case number
        /// </summary>
        public string Hearing_number { get; set; }
        
        /// <summary>
        /// The lead case name
        /// </summary>
        public string Hearing_name { get; set; }
        
        /// <summary>
        /// Scheduled date and time for the hearing
        /// </summary>
        public DateTime? Scheduled_date_time { get; set; }
        
        /// <summary>
        /// The scheduled hearing duration in minutes
        /// </summary>
        public int? Scheduled_duration { get; set; }
        
        /// <summary>
        /// Display text for the type of hearing
        /// </summary>
        public string Hearing_type_name { get; set; }
        
        /// <summary>
        /// Room name in venue 
        /// </summary>
        public string Court_room { get; set; }
        
        /// <summary>
        /// The venue display name
        /// </summary>
        public string Court_address { get; set; }
        
        /// <summary>
        /// Display name for lead judge 
        /// </summary>
        public string Judge_name { get; set; }
        
        /// <summary>
        /// Username of user that created the hearing
        /// </summary>
        public string Created_by { get; set; }
        
        /// <summary>
        /// Date and time the hearing was created
        /// </summary>
        public DateTime? Created_date { get; set; }
        
        /// <summary>
        /// Username for user that last edited the hearing (or created if not edits has occured)
        /// </summary>
        public string Last_edit_by { get; set; }
        
        /// <summary>
        /// The date and time when the hearing was last edited (or updated if no edits has occured)
        /// </summary>
        public DateTime? Last_edit_date { get; set; }
        
        /// <summary>
        /// The date and time of he hearing
        /// </summary>
        public DateTime? Hearing_date { get; set; }

    }
}