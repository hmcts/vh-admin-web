using System.Collections.Generic;
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
        private readonly VideoAccessPointsSteps _videoAccessPointsSteps;

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
            SummarySteps summarySteps,
            VideoAccessPointsSteps videoAccessPointsSteps)
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
            _videoAccessPointsSteps = videoAccessPointsSteps;
        }

        [Given(@"the (.*) user has progressed to the (.*) page")]
        public void GivenIAmOnThePage(string user, string page)
        {
            _browsersSteps.GivenANewBrowserIsOpenFor(user);
            Progression(FromString(page), "Login", page);
        }

        [When(@"the user has progressed to the (.*) page")]
        public void WhenIHaveContinuedToThePage(string page)
        {
            Progression(FromString("Video Access Points"), "Video Access Points", page);
        }

        [Given(@"the (.*) user has progressed to the (.*) page of a multi days hearing")]
        public void GivenIAmOnThePageOfMultiDaysHearing(string user, string page)
        {
            _c.Test.HearingSchedule.MultiDays = true;
            GivenIAmOnThePage(user, page);
        }

        [When(@"progresses from the (.*) page to the (.*) page")]
        public void WhenProgressesFromPageToAnotherPage(string from, string to)
        {
            Progression(FromString(to), from, to);
        }

        private static Journey FromString(string page)
        {
            if (page.ToLower().Equals(Page.BookingsList.Name.ToLower()))
            {
                return Journey.BookingsList;
            }

            if (page.ToLower().Equals(Page.BookingDetails.Name.ToLower()))
            {
                return Journey.BookingDetails;
            }

            if (page.ToLower().Equals(Page.Questionnaire.Name.ToLower()))
            {
                return Journey.Questionnaire;
            }

            if (page.ToLower().Equals(Page.ChangePassword.Name.ToLower()))
            {
                return Journey.ChangePassword;
            }

            if (page.ToLower().Equals(Page.GetAudioFile.Name.ToLower()))
            {
                return Journey.GetAudioFile;
            }

            if (page.ToLower().Equals(Page.EditParticipantName.Name.ToLower()))
            {
                return Journey.EditParticipantName;
            }

            return Journey.BookingConfirmation;
        }

        private void Progression(Journey userJourney, string startPageAsString, string endPageAsString)
        {
            var startPage = Page.FromString(startPageAsString);
            var startPageReached = false;
            var endPage = Page.FromString(endPageAsString);
            var journeys = new Dictionary<Journey, IJourney>
            {
                {Journey.BookingConfirmation, new BookingsConfirmationJourney()},
                {Journey.BookingDetails, new BookingDetailsJourney()},
                {Journey.BookingsList, new BookingListJourney()},
                {Journey.ChangePassword, new ChangePasswordJourney()},
                {Journey.GetAudioFile, new GetAudioFileJourney()},
                {Journey.Questionnaire, new QuestionnaireJourney()},
                {Journey.EditParticipantName, new EditParticipantNameJourney()}
            };
            journeys[userJourney].VerifyUserIsApplicableToJourney(_c.CurrentUser.UserType);
            journeys[userJourney].VerifyDestinationIsInThatJourney(endPage);
            _c.Route = journeys[userJourney].GetNextPage(GetRouteBasedOn(userJourney));
            var journey = journeys[userJourney].Journey();
            var steps = Steps();
            foreach (var page in journey)
            {
                if (!startPageReached)
                {
                    if (page.Equals(startPage))
                    {
                        startPageReached = true;
                    }
                    else
                    {
                        continue;
                    }
                }
                if (page != Page.Login) _browsersSteps.ThenTheUserIsOnThePage(page.Name);
                if (page.Equals(endPage)) break;
                steps[page].ProgressToNextPage();
            }
        }

        private static Page GetRouteBasedOn(Journey userJourney)
        {
            if (userJourney == Journey.BookingDetails || userJourney == Journey.BookingsList)
            {
                return Page.BookingConfirmation;
            }
            return Page.Dashboard;
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
                {Page.Summary, _summarySteps},
                {Page.VideoAccessPoints, _videoAccessPointsSteps}
            };
        }
    }
}
