using System;
using System.Collections.Generic;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class Page
    {
        public string Name { get; }
        public string Url { get; }

        private Page(string name, string url)
        {
            Name = name;
            Url = url;
        }

        public static readonly Page Login = new Page("Login", "login.microsoftonline.com");
        public static readonly Page Dashboard = new Page("Dashboard", "dashboard");
        public static readonly Page BookingsList = new Page("Bookings List", "bookings-list");
        public static readonly Page BookingDetails = new Page("Booking Details", "booking-details");
        public static readonly Page Questionnaire = new Page("Questionnaire", "questionnaire");
        public static readonly Page ChangePassword = new Page("Change Password", "change-password");
        public static readonly Page GetAudioFile = new Page("Get Audio File", "get-audio-file");
        public static readonly Page HearingDetails = new Page("Hearing Details", "book-hearing");
        public static readonly Page HearingSchedule = new Page("Hearing Schedule", "hearing-schedule");
        public static readonly Page AssignJudge = new Page("Assign Judge", "assign-judge");
        public static readonly Page AddParticipants = new Page("Add Participants", "add-participants");
        public static readonly Page OtherInformation = new Page("Other Information", "other-information");
        public static readonly Page Summary = new Page("Summary", "summary");
        public static readonly Page BookingConfirmation = new Page("Booking Confirmation", "booking-confirmation");
        public static readonly Page NotFound = new Page("Not Found", "not-found");
        public static readonly Page Unauthorised = new Page("Unauthorised", "unauthorised");
        public static readonly Page ContactUs = new Page("Contact Us", "contact-us");
        public static readonly Page OpenGovernmentLicence = new Page("Open Government Licence", "open-government-licence");
        public static readonly Page UnsupportedBrowser = new Page("Unsupported Browser", "unsupported-browser");

        public string ToString(Page page)
        {
            return page.Name;
        }

        public static Page FromString(string name)
        {
            foreach (var page in Values)
            {
                if (page.Name.ToLower().Equals(name.ToLower()))
                {
                    return page;
                }
            }
            throw new ArgumentOutOfRangeException($"No page found with name '{name}'");
        }

        private static IEnumerable<Page> Values
        {
            get
            {
                yield return Login;
                yield return Dashboard;
                yield return BookingsList;
                yield return BookingDetails;
                yield return Questionnaire;
                yield return ChangePassword;
                yield return GetAudioFile;
                yield return HearingDetails;
                yield return HearingSchedule;
                yield return AssignJudge;
                yield return AddParticipants;
                yield return OtherInformation;
                yield return Summary;
                yield return BookingConfirmation;
                yield return NotFound;
                yield return Unauthorised;
                yield return ContactUs;
                yield return OpenGovernmentLicence;
                yield return UnsupportedBrowser;
            }
        }
    }
}
