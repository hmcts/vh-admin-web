namespace AdminWebsite.AcceptanceTests.Helpers
{
    public static class DateFormats
    {
        private const string ChromeHearingDateFormat = "dd-MM-yyyy";
        private const string FirefoxHearingDateFormat = "yyyy-MM-dd";

        public static string GetHearingScheduledDate(TargetBrowser browser)
        {
            return browser == TargetBrowser.Firefox ? FirefoxHearingDateFormat : ChromeHearingDateFormat;
        }
    }
}
