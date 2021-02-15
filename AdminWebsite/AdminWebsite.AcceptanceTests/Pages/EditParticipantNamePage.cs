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
        public static By SaveButton = By.Id("saveButton");
        public static By FirstNameField = By.Id("firstName");
        public static By LastNameField = By.Id("lastName");
        public static By CompleteSignField = By.Id("completeSign");
        public static string CompleteSignText = "participant name updated";
        public static By ContactEmailLink(string email) => By.LinkText(email.ToLower());
    }
}
