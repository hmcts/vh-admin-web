using System;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class GetAudioFilePage
    {
        public static By CaseNumberTextField = By.Id("caseNumber");
        public static By SubmitButton = By.Id("submit");
        public static By GetLinkButton = By.Id("getLinkButton");
        public static By CopyLinkButton = By.Id("copyLinkButton");
        public static By LinkCopiedSuccessMessage = By.Id("linkCopied");
        public static By ResultsCaseNumber(Guid hearingId) => By.Id($"{hearingId}-case-number");
        public static By ResultsScheduledTime(Guid hearingId) => By.Id($"{hearingId}-scheduled-time");
        public static By ResultsCaseName(Guid hearingId) => By.Id($"{hearingId}-case-name");
        public static By ResultsVenue(Guid hearingId) => By.Id($"{hearingId}-venue");
    }
}
