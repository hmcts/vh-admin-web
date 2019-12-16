﻿using System.Collections.Generic;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.AcceptanceTests.Pages.Journeys;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class ProgressionSteps
    {
        private readonly TestContext _c;
        private readonly AddParticipantSteps _addParticipantSteps;
        private readonly AssignJudgeSteps _assignJudgeSteps;
        private readonly BookingConfirmationSteps _bookingConfirmationSteps;
        private readonly BookingDetailsSteps _bookingDetailsSteps;
        private readonly BookingsListSteps _bookingsListSteps;
        private readonly BrowserSteps _browsersSteps;
        private readonly DashboardSteps _dashboardSteps;
        private readonly HearingDetailsSteps _hearingDetailsSteps;
        private readonly HearingScheduleSteps _hearingScheduleSteps;
        private readonly LoginSteps _loginSteps;
        private readonly OtherInformationSteps _otherInformationSteps;
        private readonly QuestionnaireSteps _questionnaireSteps;
        private readonly SummarySteps _summarySteps;


        public ProgressionSteps(
            TestContext testContext,
            AddParticipantSteps addParticipantSteps,
            AssignJudgeSteps assignJudgeSteps,
            BookingConfirmationSteps bookingConfirmationSteps,
            BookingDetailsSteps bookingDetailsSteps,
            BookingsListSteps bookingsListSteps,
            BrowserSteps browserSteps,
            DashboardSteps dashboardSteps,
            HearingDetailsSteps hearingDetailsSteps,
            HearingScheduleSteps hearingScheduleSteps,
            LoginSteps loginSteps,
            OtherInformationSteps otherInformationSteps,
            QuestionnaireSteps questionnaireSteps,
            SummarySteps summarySteps)
        {
            _c = testContext;
            _addParticipantSteps = addParticipantSteps;
            _assignJudgeSteps = assignJudgeSteps;
            _bookingConfirmationSteps = bookingConfirmationSteps;
            _bookingDetailsSteps = bookingDetailsSteps;
            _bookingsListSteps = bookingsListSteps;
            _browsersSteps = browserSteps;
            _dashboardSteps = dashboardSteps;
            _hearingDetailsSteps = hearingDetailsSteps;
            _hearingScheduleSteps = hearingScheduleSteps;
            _loginSteps = loginSteps;
            _otherInformationSteps = otherInformationSteps;
            _questionnaireSteps = questionnaireSteps;
            _summarySteps = summarySteps;
        }

        [Given(@"the (.*) user has progressed to the (.*) page")]
        public void GivenIAmOnThePage(string user, string page)
        {
            _browsersSteps.GivenANewBrowserIsOpenFor(user);
            Progression(FromString(page), page);
        }

        private static Journey FromString(string page)
        {
            if (page.ToLower().Equals(Page.BookingsList.Name.ToLower()) || page.ToLower().Equals(Page.BookingDetails.Name.ToLower()))
            {
                return Journey.BookingDetails;
            }
            return page.ToLower().Equals("questionnaire") ? Journey.Questionnaire : Journey.BookingConfirmation;
        }

        private void Progression(Journey userJourney, string pageAsString)
        {
            var endPage = Page.FromString(pageAsString);
            var journeys = new Dictionary<Journey, IJourney>
            {
                {Journey.BookingConfirmation, new BookingsConfirmationJourney()},
                {Journey.BookingDetails, new BookingDetailsJourney()},
                {Journey.Questionnaire, new QuestionnaireJourney()}
            };
            journeys[userJourney].VerifyUserIsApplicableToJourney(_c.CurrentUser.Role);
            journeys[userJourney].VerifyDestinationIsInThatJourney(endPage);
            _c.RouteAfterDashboard = journeys[userJourney].GetNextPage(Page.Dashboard);
            var journey = journeys[userJourney].Journey();
            var steps = Steps();
            foreach (var page in journey)
            {
                if (page != Page.Login) _browsersSteps.ThenTheUserIsOnThePage(page.Name);
                if (page.Equals(endPage)) break;
                steps[page].ProgressToNextPage();
            }
        }

        private Dictionary<Page, ISteps> Steps()
        {
            return new Dictionary<Page, ISteps>
            {
                {Page.AddParticipants, _addParticipantSteps},
                {Page.AssignJudge, _assignJudgeSteps},
                {Page.BookingConfirmation, _bookingConfirmationSteps},
                {Page.BookingDetails, _bookingDetailsSteps},
                {Page.BookingsList, _bookingsListSteps},
                {Page.Dashboard, _dashboardSteps},
                {Page.HearingDetails, _hearingDetailsSteps},
                {Page.HearingSchedule, _hearingScheduleSteps},
                {Page.Login, _loginSteps},
                {Page.OtherInformation, _otherInformationSteps},
                {Page.Questionnaire, _questionnaireSteps},
                {Page.Summary, _summarySteps}
            };
        }
    }
}
