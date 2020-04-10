using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.Api.Users;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.BookingsAPI.Client;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class SummarySteps : ISteps
    {
        private const int Timeout = 60;
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly BookingDetailsSteps _bookingDetailsSteps;
        private readonly HearingDetailsSteps _hearingDetailsSteps;
        private readonly HearingScheduleSteps _hearingScheduleSteps;
        private readonly AssignJudgeSteps _assignJudgeSteps;
        private readonly AddParticipantSteps _addParticipantSteps;
        private readonly OtherInformationSteps _otherInformationSteps;
        private UserAccount _newUserToEdit;

        public SummarySteps(
            TestContext testContext, 
            Dictionary<string, UserBrowser> browsers,
            BookingDetailsSteps bookingDetailsSteps, 
            HearingDetailsSteps hearingDetailsSteps,
            HearingScheduleSteps hearingScheduleSteps,
            AssignJudgeSteps assignJudgeSteps,
            AddParticipantSteps addParticipantSteps,
            OtherInformationSteps otherInformationSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _bookingDetailsSteps = bookingDetailsSteps;
            _hearingDetailsSteps = hearingDetailsSteps;
            _hearingScheduleSteps = hearingScheduleSteps;
            _assignJudgeSteps = assignJudgeSteps;
            _addParticipantSteps = addParticipantSteps;
            _otherInformationSteps = otherInformationSteps;
        }

        [When(@"the user views the information on the summary form")]
        public void ProgressToNextPage()
        {
            VerifyHearingDetails();
            VerifyHearingSchedule();
            VerifyAudioRecording();
            VerifyOtherInformation();
            ClickBook();
            VerifyBookingCreated();
            VerifyNewUsersCreatedInAad();
        }

        public void ClickBook()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(SummaryPage.BookButton);
            _browsers[_c.CurrentUser.Key].Click(SummaryPage.BookButton);
            _c.Test.CreatedBy = _c.CurrentUser.Username;
        }

        [When(@"the user edits the (.*)")]
        public void WhenTheUserEditsTheHearing(string screen)
        {
            _bookingDetailsSteps.ClickEdit();
            _browsers[_c.CurrentUser.Key].Click(SummaryPage.EditScreenLink(screen));

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
            _browsers[_c.CurrentUser.Key].Click(SummaryPage.EditParticipantLink(_newUserToEdit.Firstname));
            _addParticipantSteps.EditANewParticipant(_newUserToEdit.AlternativeEmail);
        }

        [Then(@"the details are updated")]
        public void ThenTheHearingIsUpdated()
        {
            VerifyHearingDetails();
            VerifyHearingSchedule();
            VerifyAudioRecording();
            VerifyOtherInformation();
            ClickBook();
            VerifyBookingUpdated();
        }

        [Then(@"the participant details are updated")]
        public void ThenTheParticipantDetailsAreUpdated()
        {
            ClickBook();
            var bookingsApiManager = new BookingsApiManager(_c.AdminWebConfig.VhServices.BookingsApiUrl, _c.Tokens.BookingsApiBearerToken);
            bookingsApiManager.PollForParticipantNameUpdated(UserManager.GetClerkUser(_c.UserAccounts).Username, _c.Test.AddParticipant.Participant.NewUserPrefix).Should().BeTrue();
        }

        [Then(@"the questionnaires have been sent")]
        public void ThenTheQuestionnairesHaveBeenSent()
        {
            ProgressToNextPage();
        }

        private void VerifyHearingDetails()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(SummaryPage.CaseNumber).Text.Should().Be(_c.Test.HearingDetails.CaseNumber);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(SummaryPage.CaseName).Text.Should().Be(_c.Test.HearingDetails.CaseName);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(SummaryPage.CaseHearingType).Text.Should().Be(_c.Test.HearingDetails.HearingType.Name);
        }

        private void VerifyHearingSchedule()
        {
            var scheduleDate = _c.Test.HearingSchedule.ScheduledDate.ToString(DateFormats.HearingSummaryDate);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(SummaryPage.HearingDate).Text.ToLower().Should().Be(scheduleDate.ToLower());
            var courtAddress = $"{_c.Test.HearingSchedule.HearingVenue}, {_c.Test.HearingSchedule.Room}";
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(SummaryPage.CourtAddress).Text.Should().Be(courtAddress);
            var listedFor = $"listed for {_c.Test.HearingSchedule.DurationMinutes} minutes";
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(SummaryPage.HearingDuration).Text.Should().Be(listedFor);
        }

        private void VerifyAudioRecording()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(SummaryPage.AudioRecording).Text.Should().Be(_c.Test.AssignJudge.AudioRecord ? "Yes" : "No");
        }

        private void VerifyOtherInformation()
        {
            var otherInformation = _c.Test.OtherInformation;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(SummaryPage.OtherInformation).Text.Should().Be(otherInformation);
        }

        private void VerifyBookingCreated()
        {
            var bookingsApiManager = new BookingsApiManager(_c.AdminWebConfig.VhServices.BookingsApiUrl, _c.Tokens.BookingsApiBearerToken);
            var response = bookingsApiManager.PollForHearingByUsername(UserManager.GetClerkUser(_c.UserAccounts).Username, _c.Test.HearingDetails.CaseName);
            var hearings = RequestHelper.DeserialiseSnakeCaseJsonToResponse<List<HearingDetailsResponse>>(response.Content);
            _c.Test.HearingResponse = GetHearingFromHearings(hearings);
            var assertHearing = new AssertHearing()
                .WithHearing(_c.Test.HearingResponse)
                .WithTestData(_c.Test)
                .CreatedBy(_c.CurrentUser.Username);
            assertHearing.AssertHearingDataMatches();
            assertHearing.AssertParticipantDataMatches(_c.Test.HearingParticipants);
            assertHearing.AssertHearingStatus(BookingStatus.Booked);
        }

        private void VerifyBookingUpdated()
        {
            Thread.Sleep(TimeSpan.FromSeconds(0.5));
            var bookingsApiManager = new BookingsApiManager(_c.AdminWebConfig.VhServices.BookingsApiUrl, _c.Tokens.BookingsApiBearerToken);
            var response = bookingsApiManager.PollForHearingByUsername(UserManager.GetClerkUser(_c.UserAccounts).Username, _c.Test.HearingDetails.CaseName);
            var hearings = RequestHelper.DeserialiseSnakeCaseJsonToResponse<List<HearingDetailsResponse>>(response.Content);
            _c.Test.HearingResponse = GetHearingFromHearings(hearings);
            var assertHearing = new AssertHearing()
                .WithHearing(_c.Test.HearingResponse)
                .WithTestData(_c.Test)
                .CreatedBy(_c.CurrentUser.Username);
            assertHearing.AssertHearingDataMatches();
            assertHearing.AssertParticipantDataMatches(_c.Test.HearingParticipants);
            assertHearing.AssertUpdatedStatus(_c.CurrentUser.Username, DateTime.Now);
        }

        private HearingDetailsResponse GetHearingFromHearings(IEnumerable<HearingDetailsResponse> hearings)
        {
            foreach (var hearing in hearings.Where(hearing => hearing.Cases.First().Name.Equals(_c.Test.HearingDetails.CaseName)))
            {
                return hearing;
            }
            throw new DataException("Created hearing could not be found in the bookings api");
        }

        private void VerifyNewUsersCreatedInAad()
        {
            var userApiManager = new UserApiManager(_c.AdminWebConfig.VhServices.UserApiUrl, _c.Tokens.UserApiBearerToken);
            foreach (var participant in _c.Test.HearingParticipants.Where(participant => participant.DisplayName.Contains(_c.Test.TestData.AddParticipant.Participant.NewUserPrefix)))
            {
                userApiManager.CheckIfParticipantExistsInAad(participant.AlternativeEmail, Timeout);
            }
            _c.Test.SubmittedAndCreatedNewAadUsers = true;
        }
    }
}
