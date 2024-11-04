using System.Text.Json.Serialization;

namespace AdminWebsite.Contracts.Requests
{
    public class CancelMultiDayHearingRequest
    {
        /// <summary>
        /// When true, applies updates to future days of the multi day hearing as well
        /// </summary>
        [JsonRequired]
        public bool UpdateFutureDays { get; set; }

        /// <summary>
        /// The reason for cancelling the video hearing
        /// </summary>
        public string CancelReason { get; set; }
    }
}
