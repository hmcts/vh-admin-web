using System;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class DeleteUserPage
    {
        public static By CaseNumberTextField = By.Id("username");
        public static By SubmitButton = By.Id("submit");
        public static By ResultsCaseNumber(Guid hearingId) => By.Id($"{hearingId}-case-number");
        public static By ResultsScheduledTime(Guid hearingId) => By.Id($"{hearingId}-scheduled-time");
        public static By ResultsCaseName(Guid hearingId) => By.Id($"{hearingId}-case-name");
        public static By ResultsVenueName(Guid hearingId) => By.Id($"{hearingId}-venue");
    }
}