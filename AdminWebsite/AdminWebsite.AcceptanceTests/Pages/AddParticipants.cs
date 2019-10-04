using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.AcceptanceTests.Data;
using System.Collections;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class AddParticipants : Common
    {
        public AddParticipants(Browser browser) : base(browser)
        {
        }

        private static By CompanyName => By.Id("companyName");
        public void Title(string title) => SelectOption(CommonLocator.List("title"), title);
        public void ParticipantEmail(string email) => ClearFieldInputValues(By.Id("participantEmail"), email);
        public void FirstName(string firstname) => ClearFieldInputValues(By.Id("firstName"), firstname);
        public void LastName(string lastname) => ClearFieldInputValues(By.Id("lastName"), lastname);
        public void Telephone(string phone) => ClearFieldInputValues(By.Id("phone"), phone);
        public void DisplayName(string displayname) => ClearFieldInputValues(By.Id("displayName"), displayname);
        public void AddParticipantButton() => ClickElement(By.Id("addParticipantBtn"));
        public void AddParty(PartyType party) => SelectOption(CommonLocator.List("party"), party.ToString());
        public void AddRole(string role) => SelectOption(CommonLocator.List("role"), role);
        public IEnumerable<string> PartyList() => Items(CommonLocator.List("party"));
        public void ClearInput() => ClickElement(By.Id("clearFormBtn"));
        public IEnumerable<string> ParticipantPageErrorMessages() => Items(By.XPath("//*[@class='govuk-list govuk-error-summary__list']/li"));
        public bool PartyFieldEnabled => IsElementEnabled(By.Id("party"));
        public bool RoleFieldEnabled => IsElementEnabled(By.Id("role"));
        public bool EmailEnabled => IsElementEnabled(By.Id("participantEmail"));
        public bool FirstnameEnabled => IsElementEnabled(By.Id("firstName"));
        public bool LastnameEnabled => IsElementEnabled(By.Id("lastName"));
        public void HouseNumber(string houseNumber) => ClearFieldInputValues(By.Id("houseNumber"), houseNumber);
        public void Street(string street) => ClearFieldInputValues(By.Id("street"), street);
        public void City(string city) => ClearFieldInputValues(By.Id("city"), city);
        public void County(string county) => ClearFieldInputValues(By.Id("county"), county);
        public void Postcode(string postcode) => ClearFieldInputValues(By.Id("postcode"), postcode);
        public string RoleValue() => ExecuteScript("return document.getElementById('role').value", By.Id("role"));
        public void Organisation(string organisation) => ClearFieldInputValues(CompanyName, organisation);
        public void SolicitorReference(string reference) => ClearFieldInputValues(By.Id("solicitorReference"), reference);
        public void ClientRepresenting(string client) => ClearFieldInputValues(By.Id("representing"), client);
        public void ExistingParticipant(string contactEmail)
        {
            IWebElement webElement = null;

            try
            {
                webElement = GetListOfElements(By.CssSelector("a.vh-a-email")).Single(u => u.Text == contactEmail);
            } catch (InvalidOperationException exception)
            {
                Console.WriteLine(exception.Message);
                webElement = null;
            }

            if (webElement == null)
            {
                throw new Exception($"Failed to find an existing person in response matching contact email: {contactEmail}");
            }
            else
            {
                webElement.Click();
            }
        }
        public string GetFieldValue(string field) => ExecuteScript($"return document.getElementById('{field}').value");

        public ArrayList ValidateAddParticipantFormIsCleared()
        {
            string[] dropdownFormFields = { "party", "role"};
            var errorFields = CheckDropDownsAreReset(dropdownFormFields);

            string[] participantDetailsFormFields = { "participantEmail", "title", "firstName", "lastName",
                                                "companyNameIndividual", "phone", "displayName"};
            errorFields.AddRange(CheckHiddenInputFieldsAreNotDisplayed(participantDetailsFormFields));

            string[] addressDetailsFormFields = { "houseNumber", "street", "city", "county", "postcode" };
            errorFields.AddRange(CheckHiddenInputFieldsAreNotDisplayed(addressDetailsFormFields));

            return errorFields;
        }

        private ArrayList CheckHiddenInputFieldsAreNotDisplayed(string[] hiddenFormFieldsAddressDetails)
        {
            var errorFields = new ArrayList();

            foreach (string field in hiddenFormFieldsAddressDetails)
            {
                try
                {
                    var value = GetFieldValue(field);
                    if (!string.IsNullOrEmpty(value))
                        errorFields.Add(field);
                }
                catch(WebDriverException exception)
                {
                    if (!exception.Message.Contains("javascript error: Cannot read property 'value' of null"))
                        errorFields.Add(field);
                }
            }

            return errorFields;
        }

        private ArrayList CheckDropDownsAreReset(string[] formFields)
        {
            var errorFields = new ArrayList();

            foreach (string field in formFields)
            {
                var value = GetFieldValue(field);
                if(value != "0: Please select")
                {
                    errorFields.Add(field);
                }
            }

            return errorFields;
        }

        internal void WaitForAddParticipantDetailsFormHidden()
        {
            try
            {
                var count = 0;
                var value = GetFieldValue("participantEmail");
                while (!string.IsNullOrEmpty(value) || count < 3) {
                    System.Threading.Thread.Sleep(10000);
                    value = GetFieldValue("participantEmail");
                    count++;
                }
            }
            catch (WebDriverException)
            {
                return;
            }
        }
    }
}
