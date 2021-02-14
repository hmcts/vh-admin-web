using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Text;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class EditParticipantNamePage
    {
        public static By ContactEmailTextField = By.Id("contactEmail");
        public static By SubmitButton = By.Id("submit");
        public static By FullNameField = By.Id("fullName");
        public static By UserNotFounMessage = CommonLocators.ElementContainingText("Sorry, we can't find a user with that name.");
        public static By JudgeNotAllowedToBeEditedMessage = CommonLocators.ElementContainingText("Judge accounts cannot be edited");
    }
}
