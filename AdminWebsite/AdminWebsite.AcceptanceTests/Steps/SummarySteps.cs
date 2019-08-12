using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System;
using System.Linq;
using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.AcceptanceTests.Data;
using TechTalk.SpecFlow;
using OtherInformation = AdminWebsite.AcceptanceTests.Data.OtherInformation;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class SummarySteps
    {
        private readonly TestContext _context;
        private readonly Summary _summary;

        public SummarySteps(TestContext context, Summary summary)
        {
            _context = context;
            _summary = summary;
        }

        [Then(@"hearing summary is displayed on summary page")]
        public void ThenHearingSummaryIsDisplayedOnSummaryPage()
        {
            SummaryPage();
        }

        [When(@"Admin user is on summary page")]
        [Then(@"user should be on summary page")]
        public void SummaryPage()
        {
            _summary.PageUrl(PageUri.SummaryPage);
        }

        [Then(@"values should be displayed as expected on summary page")]
        public void ThenInputtedValuesShouldBeDisplayedAsExpectedOnSummaryPage()
        {
            SummaryPage();            
            switch (_summary.GetItems("RelevantPage"))
            {
                case PageUri.HearingDetailsPage :
                    _summary.CaseName().Should().Be(_context.TestData.HearingData.CaseName);
                    _summary.CaseNumber().Should().Be(_context.TestData.HearingData.CaseNumber);
                    _summary.CaseHearingType().Should().Be(_context.TestData.HearingData.CaseHearingType);
                    break;
                case PageUri.HearingSchedulePage:
                    _summary.HearingDate().ToLower().Should().Be(_summary.GetItems("HearingDate"));
                    _summary.CourtAddress().Should().Be($"{HearingScheduleData.CourtAddress.Last()}, {_context.TestData.HearingScheduleData.Room}");
                    _summary.HearingDuration().Should().Be("listed for 30 minutes");
                    break;
                case PageUri.OtherInformationPage:
                    _summary.OtherInformation().Should().Be(OtherInformation.OtherInformationText);
                    break;
                case PageUri.AssignJudgePage:
                    _summary.Judge().Should().Contain(_summary.GetItems("Clerk"));
                    break;
                case PageUri.AddParticipantsPage:
                    var expectedResult = $"{_summary.GetItems("Title")} {_context.TestData.ParticipantData.Firstname} {_summary.GetItems("Lastname")}";
                    _summary.GetParticipantDetails().Should().Contain(expectedResult.Trim());
                    break;
            }
        }

        [When(@"user navigates to (.*) page to make changes")]
        public void UserNavigatesToRelevantPage(string relevantPage)
        {
            string pageUri = null;
            switch (relevantPage)
            {
                case "hearing details": pageUri = PageUri.HearingDetailsPage;
                    _summary.EditHearingDetails();
                    break;
                case "hearing schedule": pageUri = PageUri.HearingSchedulePage;
                    _summary.EditScheduleDetails();
                    break;
                case "more information": pageUri = PageUri.OtherInformationPage;
                    _summary.EditMoreInformation();
                    break;
                case "add judge": pageUri = PageUri.AssignJudgePage;
                    _summary.EditRoundedBorder("Change");
                    break;
                case "add participants": pageUri = PageUri.AddParticipantsPage;
                    _summary.EditRoundedBorder("Edit");
                    break;
            }
            _summary.AddItems<string>("RelevantPage", pageUri);
        }

        [When(@"user removes participant on summary page")]
        public void GivenUserRemovesParticipantOnSummaryPage()
        {
            _summary.EditRoundedBorder("Remove");
        }

        [Then(@"participant should be removed from the list")]
        public void ThenParticipantShouldBeRemovedFromTheList()
        {
            _summary.ParticipantConfirmationMessage().Should().Contain("Are you sure you want to remove");
            _summary.RemoveParticipant();
            var exception = string.Empty;
            try
            {
                _summary.GetParticipantDetails().Should().NotBeNullOrEmpty();
            }
            catch (Exception ex)
            {
                if (ex.InnerException != null)
                    exception = ex.InnerException.Message;
            }
            exception.ToLower().Should().Contain("unable to locate element:");
        }

        [Then(@"inputted values should not be saved")]
        public void ThenInputtedValuesShouldNotBeSaved()
        {
            SummaryPage();
            switch (_summary.GetItems("RelevantPage"))
            {
                case PageUri.HearingDetailsPage:
                    _summary.CaseName().Should().NotBe(_context.TestData.HearingData.CaseName);
                    _summary.CaseNumber().Should().NotBe(_context.TestData.HearingData.CaseNumber);
                    break;
            }
        }

        [When(@"user cancels the process of removing participant")]
        public void WhenUserCancelsTheProcessOfRemovingParticipant()
        {
            _summary.ParticipantConfirmationMessage().Should().Contain("Are you sure you want to remove");
            _summary.CancelRemoveParticipant();
        }

        [Then(@"participant should still be in the list")]
        public void ThenParticipantShouldStillBeInTheList()
        {
            _summary.GetParticipantDetails().Should().NotBeNullOrEmpty();
        }

        [When(@"user submits the booking")]
        public void WhenUserSubmitBooking()
        {
            _summary.Book();
        }
    }
}