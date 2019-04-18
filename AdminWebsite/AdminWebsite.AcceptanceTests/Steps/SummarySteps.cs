﻿using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System;
using System.Linq;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class SummarySteps
    {
        private readonly Summary _summary;
        public SummarySteps(Summary summary)
        {
            _summary = summary;
        }
        [Then(@"hearing summary is displayed on summary page")]
        public void ThenHearingSummaryIsDisplayedOnSummaryPage()
        {
            SummaryPage();
        }
        [Then(@"user should be on summary page")]
        [When(@"Admin user is on summary page")]
        public void SummaryPage()
        {
            _summary.PageUrl(PageUri.SummaryPage);
        }
        
        [Then(@"inputted values should be displayed as expected on summary page")]
        public void ThenInputtedValuesShouldBeDisplayedAsExpectedOnSummaryPage()
        {
            SummaryPage();            
            switch (_summary.GetItems("RelevantPage"))
            {
                case PageUri.HearingDetailsPage :
                    _summary.CaseName().Should().Be(TestData.HearingDetails.CaseName1);
                    _summary.CaseNumber().Should().Be(TestData.HearingDetails.CaseNumber1);
                    _summary.CaseHearingType().Should().Be(TestData.HearingDetails.CaseHearingType);
                    break;
                case PageUri.HearingSchedulePage:
                    _summary.HearingDate().ToLower().Should().Be(_summary.GetItems("HearingDate"));
                    _summary.CourtAddress().Should().Be($"{TestData.HearingSchedule.CourtAddress.ToList().Last()}, {TestData.HearingSchedule.Room}");
                    _summary.HearingDuration().Should().Be("listed for 30 minutes");
                    break;
                case PageUri.OtherInformationPage:
                    _summary.OtherInformation().Should().Be(TestData.OtherInformation.OtherInformationText);
                    break;
                case PageUri.AssignJudgePage:
                    _summary.Judge().Should().Contain(_summary.GetItems("Judge"));
                    break;
                case PageUri.AddParticipantsPage:
                    string expectedResult = $"{_summary.GetItems("Title")} {TestData.AddParticipants.Firstname} {TestData.AddParticipants.Lastname}";
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
                    _summary.CaseName().Should().NotBe(TestData.HearingDetails.CaseName1);
                    _summary.CaseNumber().Should().NotBe(TestData.HearingDetails.CaseNumber1);
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
        [When(@"user submit booking")]
        public void WhenUserSubmitBooking()
        {
            _summary.Book();
        }
        [Then(@"")]
        public void UpdateParticipantDetails()
        {
        }
    }
}