﻿using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class Summary : Common
    {
        public Summary(BrowserContext browserContext) : base(browserContext)
        {
        }

        public string CaseNumber() => GetElementText(By.Id("caseNumber"));
        public string CaseName() => GetElementText(By.Id("caseName"));
        public string CaseHearingType() => GetElementText(By.Id("caseHearingType"));
        public string HearingDate() => GetElementText(By.Id("hearingDate"));
        public string CourtAddress() => GetElementText(By.Id("courtAddress"));
        public string HearingDuration() => GetElementText(By.Id("hearingDuration"));
        public string OtherInformation() => GetElementText(By.Id("otherInformation"));
        private By _particpantRoundedBoarder => By.XPath("//a[@class='vhlink']");

        // New attribute to be added to the html for below element
        public string Judge() => GetElementText(By.XPath("//*[@class='govuk-grid-column-one-half vhtable-header vh-image-50']"));
        public void Book() => ClickElement(By.Id("bookButton"));
        public void EditParticipantRoundedBoarder(string uri) => SelectOption(_particpantRoundedBoarder, uri);
        public void RemoveParticipant() => ClickElement(By.Id("btn-remove"));
        public void CancelRemoveParticipant() => ClickElement(By.Id("btn-cancel"));
        public string ParticipantConfirmationMessage() => GetElementText(By.XPath("//h1[contains(text(),'hearing booking')]"));
        public void EditHearingDetails() => ClickElement(By.Id("edit-linkhearing-details-id"));
        public void EditScheduleDetails() => ClickElement(By.Id("edit-linkhearing-schedule-id"));
        public void EditMoreInformation() => ClickElement(By.Id("edit-linkother-information-id"));
    }
}