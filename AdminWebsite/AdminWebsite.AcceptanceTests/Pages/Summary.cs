using System.Linq;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using FluentAssertions;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class Summary : Common
    {
        public Summary(Browser browser) : base(browser)
        {
        }

        public string CaseNumber() => GetElementText(By.Id("caseNumber"));
        public string CaseName() => GetElementText(By.Id("caseName"));
        public string CaseHearingType() => GetElementText(By.Id("caseHearingType"));
        public string HearingDate() => GetElementText(By.Id("hearingDate"));
        public string CourtAddress() => GetElementText(By.Id("courtAddress"));
        public string HearingDuration() => GetElementText(By.Id("hearingDuration"));
        public string OtherInformation() => GetElementText(By.Id("otherInformation"));
        private static By Border => By.XPath("//a[@class='vhlink']");

        public string Judge() => GetElementText(By.Id("judge-name"));
        public void Book() => ClickBookButton();
        public void EditRoundedBorder(string uri) => SelectOption(Border, uri);
        public void RemoveParticipant() => ClickElement(By.Id("btn-remove"));
        public void CancelRemoveParticipant() => ClickElement(By.Id("btn-cancel"));
        public string ParticipantConfirmationMessage() => GetElementText(By.XPath("//h1[contains(text(),'hearing booking')]"));
        public void EditHearingDetails() => ClickElement(By.Id("edit-linkhearing-details-id"));
        public void EditScheduleDetails() => ClickElement(By.Id("edit-linkhearing-schedule-id"));
        public void EditMoreInformation() => ClickElement(By.Id("edit-linkother-information-id"));

        public void ParticipantsAreDisplayedInTheList(TestData testData)
        {
            var actualResult = GetAllParticipantsDetails();                

            foreach (var participant in testData.ParticipantData)
            {
                var expectedParticipant = $"{participant.Title} {participant.Firstname} {participant.Lastname} {participant.Role.ToString().Replace("LIP", " LIP")}";

                if (participant.Role == RoleType.Solicitor)
                    expectedParticipant = $"{expectedParticipant}, representing {participant.ClientRepresenting}";

                actualResult.Any(x => x.Replace(System.Environment.NewLine, " ").Equals(expectedParticipant)).Should().BeTrue();
            }
        }
    }
}