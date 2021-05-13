namespace AdminWebsite.Services.Models
{
    public class TeleConferenceDetails
    {
        public string TeleConferencePhoneNumber { get; }
        public string TeleConferenceId { get; }

        public TeleConferenceDetails(string teleConferencePhoneNumber, string teleConferenceId)
        {
            TeleConferencePhoneNumber = teleConferencePhoneNumber;
            TeleConferenceId = teleConferenceId;
        }
    }
}