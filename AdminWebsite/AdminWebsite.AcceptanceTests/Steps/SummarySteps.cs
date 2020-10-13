using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class SummarySteps : ISteps
    {
        private const int TIMEOUT = 60;
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly BookingDetailsSteps _bookingDetailsSteps;
        private readonly HearingDetailsSteps _hearingDetailsSteps;
        private readonly HearingScheduleSteps _hearingScheduleSteps;
        private readonly AssignJudgeSteps _assignJudgeSteps;
        private readonly AddParticipantSteps _addParticipantSteps;
        private readonly OtherInformationSteps _otherInformationSteps;
        private readonly VideoAccessPointsSteps _videoAccessPointsSteps;
        private UserAccount _newUserToEdit;

        public SummarySteps(
            TestContext testContext,
            Dictionary<User, UserBrowser> browsers,
            BookingDetailsSteps bookingDetailsSteps,
            HearingDetailsSteps hearingDetailsSteps,
            HearingScheduleSteps hearingScheduleSteps,
            AssignJudgeSteps assignJudgeSteps,
            AddParticipantSteps addParticipantSteps,
            OtherInformationSteps otherInformationSteps,
            VideoAccessPointsSteps videoAccessPointsSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _bookingDetailsSteps = bookingDetailsSteps;
            _hearingDetailsSteps = hearingDetailsSteps;
            _hearingScheduleSteps = hearingScheduleSteps;
            _assignJudgeSteps = assignJudgeSteps;
            _addParticipantSteps = addParticipantSteps;
            _otherInformationSteps = otherInformationSteps;
            _videoAccessPointsSteps = videoAccessPointsSteps;
        }

        [When(@"the user views the information on the summary form")]
        public void ProgressToNextPage()
        {
            VerifyHearingDetails();
            VerifyHearingSchedule();
            VerifyAudioRecording();
            VerifyVideoAccessPoints();
            VerifyOtherInformation();
            ClickBook();
            VerifyBookingsCreated();
            VerifyNewUsersCreatedInAad();
        }

        public void ClickBook()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SummaryPage.BookButton);
            _browsers[_c.CurrentUser].Click(SummaryPage.BookButton);
            _c.Test.CreatedBy = _c.CurrentUser.Username;
        }

        [When(@"the user edits the (.*)")]
        public void WhenTheUserEditsTheHearing(string screen)
        {
            _bookingDetailsSteps.ClickEdit();
            _browsers[_c.CurrentUser].Click(SummaryPage.EditScreenLink(screen));

            if (screen.Equals("hearing details"))
            {
                _hearingDetailsSteps.EditHearingDetails();
            }
            else if (screen.Equals("hearing schedule"))
            {
                _hearingScheduleSteps.EditHearingSchedule();
            }
            else if (screen.Equals("audio recording"))
            {
                _assignJudgeSteps.EditAudioRecording();
            }
            else if (screen.Equals("other information"))
            {
                _otherInformationSteps.ProgressToNextPage();
            }
        }

        [When(@"the user edits a new participant")]
        public void WhenTheUserEditsANewParticipant()
        {
            _bookingDetailsSteps.ClickEdit();
            _newUserToEdit = UserManager.GetUserFromDisplayName(_c.Test.HearingParticipants, _c.Test.AddParticipant.Participant.NewUserPrefix);
            _browsers[_c.CurrentUser].Click(SummaryPage.EditParticipantLink(_newUserToEdit.Firstname));
            _addParticipantSteps.EditANewParticipant(_newUserToEdit.AlternativeEmail);
        }

        [When(@"the user edits an endpoint display name")]
        public void WhenTheUserEditsAnEndpointDisplayName()
        {
            _bookingDetailsSteps.ClickEdit();
            _browsers[_c.CurrentUser].Click(SummaryPage.EditScreenLink("video access points"));
            _videoAccessPointsSteps.ProgressToNextPage();
        }

        [Then(@"the details are updated")]
        public void ThenTheHearingIsUpdated()
        {
            VerifyHearingDetails();
            VerifyHearingSchedule();
            VerifyAudioRecording();
            VerifyVideoAccessPoints();
            VerifyOtherInformation();
            ClickBook();
            VerifyBookingUpdated();
        }

        [Then(@"the participant details are updated")]
        public void ThenTheParticipantDetailsAreUpdated()
        {
            ClickBook();
            _c.Api.PollForParticipantNameUpdated(Users.GetJudgeUser(_c.Users).Username, _c.Test.AddParticipant.Participant.NewUserPrefix).Should().BeTrue();
        }

        [Then(@"the questionnaires have been sent")]
        public void ThenTheQuestionnairesHaveBeenSent()
        {
            ProgressToNextPage();
        }

        private void VerifyHearingDetails()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SummaryPage.CaseNumber).Text.Should().Be(_c.Test.HearingDetails.CaseNumber);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SummaryPage.CaseName).Text.Should().Be(_c.Test.HearingDetails.CaseName);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SummaryPage.CaseType).Text.Should().Be(_c.Test.HearingDetails.CaseType.Name);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SummaryPage.HearingType).Text.Should().Be(_c.Test.HearingDetails.HearingType.Name);
        }

        private void VerifyHearingSchedule()
        {
            if (!_c.Test.HearingSchedule.MultiDays)
            {
                var scheduleDate = _c.Test.HearingSchedule.ScheduledDate.ToString(DateFormats.HearingSummaryDate);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SummaryPage.HearingDate).Text.ToLower().Should().Be(scheduleDate.ToLower());
                var listedFor = $"listed for {_c.Test.HearingSchedule.DurationMinutes} minutes";
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SummaryPage.HearingDuration).Text.Should().Be(listedFor);
            }
            else
            {
                var startDate = _c.Test.HearingSchedule.ScheduledDate.ToString(DateFormats.HearingSummaryDateMultiDays);
                var endDate = _c.Test.HearingSchedule.EndHearingDate.ToString(DateFormats.HearingSummaryDateMultiDays);
                var startTime = _c.Test.HearingSchedule.ScheduledDate.ToString(DateFormats.HearingSummaryTimeMultiDays);
                var textDateStart = $"{startDate.ToLower()} -";
                var textDateEnd = $"{endDate.ToLower()}, {startTime.ToLower()}";

                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SummaryPage.HearingStartDateMultiDays).Text.ToLower().Should().Be(textDateStart);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SummaryPage.HearingEndDateMultiDays).Text.ToLower().Should().Be(textDateEnd);
            }

            var courtAddress = $"{_c.Test.HearingSchedule.HearingVenue}, {_c.Test.HearingSchedule.Room}";
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SummaryPage.CourtAddress).Text.Should().Be(courtAddress);
        }

        private void VerifyAudioRecording()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SummaryPage.AudioRecording).Text.Should().Be(_c.Test.AssignJudge.AudioRecord ? "Yes" : "No");
        }

        private void VerifyOtherInformation()
        {
            var otherInformation = _c.Test.OtherInformation;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SummaryPage.OtherInformation).Text.Should().Be(otherInformation);
        }

        private void VerifyVideoAccessPoints()
        {
            var videoAccessPoints = _c.Test.VideoAccessPoints.DisplayName;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SummaryPage.VideoAccessPoints(0)).Text.Should().Be(videoAccessPoints);
        }

        private void VerifyBookingsCreated()
        {
            var response = _c.Api.PollForHearingByUsername(Users.GetJudgeUser(_c.Users).Username, _c.Test.HearingDetails.CaseName);
            var allHearings = RequestHelper.Deserialise<List<HearingDetailsResponse>>(response.Content);
            var hearings = GetHearingFromHearings(allHearings);

            foreach (var assertHearing in hearings.Select(hearing => new AssertHearing()
                .WithHearing(hearing)
                .WithTestData(_c.Test)
                .WithTimeZone(_c.TimeZone)
                .IsMultiDayHearing(_c.Test.HearingSchedule.MultiDays)
                .CreatedBy(_c.CurrentUser.Username)))
            {
                assertHearing.AssertHearingDataMatches();
                assertHearing.AssertParticipantDataMatches(_c.Test.HearingParticipants);
                assertHearing.AssertHearingStatus(BookingStatus.Booked);
            }
        }

        private void VerifyBookingUpdated()
        {
            Thread.Sleep(TimeSpan.FromSeconds(0.5));
            var response = _c.Api.PollForHearingByUsername(Users.GetJudgeUser(_c.Users).Username, _c.Test.HearingDetails.CaseName);
            var allHearings = RequestHelper.Deserialise<List<HearingDetailsResponse>>(response.Content);
            var hearings = GetHearingFromHearings(allHearings);

            foreach (var assertHearing in hearings.Select(hearing => new AssertHearing()
                .WithHearing(hearing)
                .WithTestData(_c.Test)
                .WithTimeZone(_c.TimeZone)
                .IsMultiDayHearing(_c.Test.HearingSchedule.MultiDays)
                .IsRunningOnSauceLabs(_c.WebConfig.SauceLabsConfiguration.RunningOnSauceLabs())
                .CreatedBy(_c.CurrentUser.Username)))
            {
                assertHearing.AssertHearingDataMatches();
                assertHearing.AssertParticipantDataMatches(_c.Test.HearingParticipants);
                assertHearing.AssertUpdatedStatus(_c.CurrentUser.Username, DateTime.Now);
            }
        }

        private List<HearingDetailsResponse> GetHearingFromHearings(IEnumerable<HearingDetailsResponse> allHearings)
        {
            var hearings = allHearings.Where(hearing => hearing.Cases.First().Name.Contains(_c.Test.HearingDetails.CaseName)).ToList();

            if (hearings.Count == 0)
            {
                throw new DataException("Created hearing could not be found in the bookings api");
            }

            return hearings;
        }

        private void VerifyNewUsersCreatedInAad()
        {
            foreach (var participant in _c.Test.HearingParticipants.Where(participant => participant.DisplayName.Contains(_c.Test.TestData.AddParticipant.Participant.NewUserPrefix)))
            {
                _c.Api.PollForParticipantExistsInAD(participant.Username, TIMEOUT);
            }
            _c.Test.SubmittedAndCreatedNewAadUsers = true;
        }
    }
}
