using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Api.Helpers;
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
    public class BookingDetailsSteps : ISteps
    {
        private const int Timeout = 60;
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly CommonSharedSteps _commonSharedSteps;

        public BookingDetailsSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, CommonSharedSteps commonSharedSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _commonSharedSteps = commonSharedSteps;
        }

        public void ProgressToNextPage()
        {
            WhenTheUserConfirmsTheBooking();
            ThenTheHearingIsAvailableInTheVideoWeb();
        }

        [When(@"the user views the booking details")]
        [Then(@"the user views the booking details")]
        public void WhenTheUserViewsTheBookingDetails()
        {
            PollForHearingStatus(BookingStatus.Booked);
            VerifyTheBookingDetails();
            VerifyJudgeInParticipantsList();
            VerifyTheParticipantDetails();
        }

        private void VerifyTheBookingDetails()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.CaseNumberTitle).Text.Should().Be(_c.Test.HearingDetails.CaseNumber);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.CreatedBy).Text.Should().Be(_c.Test.CreatedBy);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.CreatedDate).Text.Should().NotBeNullOrWhiteSpace();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.CaseNumber).Text.Should().Be(_c.Test.HearingDetails.CaseNumber);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.CaseName).Text.Should().Be(_c.Test.HearingDetails.CaseName);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.HearingType).Text.Should().Be(_c.Test.HearingDetails.CaseType.Name);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.HearingStartDate).Text.ToLower().Should().Be(_c.Test.HearingSchedule.ScheduledDate.ToLocalTime().ToString(DateFormats.HearingSummaryDate).ToLower());
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.CourtroomAddress).Text.Should().Be($"{_c.Test.HearingSchedule.HearingVenue}, {_c.Test.HearingSchedule.Room}");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.Duration).Text.Should().Contain($"listed for {_c.Test.HearingSchedule.DurationMinutes} minutes");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.AudioRecorded).Text.Should().Be(_c.Test.AssignJudge.AudioRecord ? "Yes" : "No");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.OtherInformation).Text.Should().Be(_c.Test.OtherInformation);
        }

        private void VerifyJudgeInParticipantsList()
        {
            var judge = UserManager.GetClerkUser(_c.Test.HearingParticipants);
            var hearingJudge = _c.Test.HearingResponse.Participants.First(x => x.User_role_name.Equals("Judge"));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.JudgeName).Text.Should().Contain(judge.DisplayName);
            if (!OnlyDisplayEmailAndUsernameIfCurrentUserMadeTheBooking()) return;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantEmail(hearingJudge.Id)).Text.Should().Be(judge.AlternativeEmail);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantUsername(hearingJudge.Id)).Text.Should().Be(judge.Username);
        }

        private bool OnlyDisplayEmailAndUsernameIfCurrentUserMadeTheBooking()
        {
            return _c.CurrentUser.Username.Equals(_c.Test.CreatedBy);
        }

        private void VerifyTheParticipantDetails()
        {
            foreach (var participant in _c.Test.HearingResponse.Participants)
            {
                if (participant.User_role_name.Equals("Judge"))
                {
                    VerifyJudgeDetails(participant);
                }
                else
                {
                    VerifyParticipant(participant);
                }

                if (!OnlyDisplayEmailAndUsernameIfCurrentUserMadeTheBooking()) continue;
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantEmail(participant.Id)).Text.Trim().Should().Be(participant.Contact_email);
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantUsername(participant.Id)).Text.Trim().Should().Be(participant.Username);
            }
        }

        private void VerifyJudgeDetails(ParticipantResponse participant)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.JudgeName).Text.Trim().Should().Contain(participant.Display_name);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.JudgeRole).Text.Trim().Should().Be(participant.User_role_name);
        }

        private void VerifyParticipant(ParticipantResponse participant)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantName(participant.Id)).Text.Trim().Should().Contain($"{_c.Test.TestData.AddParticipant.Participant.Title} {participant.First_name} {participant.Last_name}");
            if (participant.User_role_name.Equals("Representative"))
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantRepresentee(participant.Id)).Text.Trim().Should().Be(participant.Representee);
            }
            else
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantRole(participant.Id)).Text.Trim().Should().Be(participant.Hearing_role_name);
            }
        }

        [When(@"the user confirms the booking")]
        public void WhenTheUserConfirmsTheBooking()
        {
            _browsers[_c.CurrentUser.Key].ScrollTo(BookingDetailsPage.ConfirmButton);
            _browsers[_c.CurrentUser.Key].Click(BookingDetailsPage.ConfirmButton);
            _browsers[_c.CurrentUser.Key].ScrollTo(BookingDetailsPage.ConfirmedLabel);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.ConfirmedLabel).Displayed.Should().BeTrue();
        }

        [Then(@"the hearing is available in the video web")]
        public void ThenTheHearingIsAvailableInTheVideoWeb()
        {
            PollForHearingStatus(BookingStatus.Created).Should().BeTrue();
            _c.Apis.VideoApi.PollForConferenceExists(GetHearing().Id).Should().BeTrue();
        }

        [When(@"the user cancels the hearing without a cancel reason")]
        public void WhenTheUserCancelsTheHearingWithoutACancelReason()
        {
            _browsers[_c.CurrentUser.Key].ScrollTo(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser.Key].Click(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser.Key].Click(BookingDetailsPage.ConfirmCancelButton);
        }

        [Then(@"an error message is displayed and hearing is not cancelled")]
        public void ThenAnErrorMessageIsDisplayedAndHearingIsNotCancelled()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.CancelReasonDropdownErrorLabel).Displayed.Should().BeTrue();
            PollForHearingStatus(BookingStatus.Cancelled).Should().BeFalse();
            _browsers[_c.CurrentUser.Key].Click(BookingDetailsPage.KeepBookingButton);
        }

        [When(@"the user cancels the hearing")]
        public void WhenTheUserAttemptsToCancelTheHearing()
        {
            _browsers[_c.CurrentUser.Key].ScrollTo(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser.Key].Click(BookingDetailsPage.CancelButton);

            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver,
                BookingDetailsPage.CancelReasonDropdown, _c.Test.TestData.BookingDetailsPage.CancelReason);
            _browsers[_c.CurrentUser.Key].Click(BookingDetailsPage.ConfirmCancelButton);
        }

        [When(@"the user cancels the hearing with other reason and no text")]
        public void WhenTheUserCancelsTheHearingWithOtherReason()
        {
            _browsers[_c.CurrentUser.Key].ScrollTo(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser.Key].Click(BookingDetailsPage.CancelButton);

            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver,
                BookingDetailsPage.CancelReasonDropdown, _c.Test.TestData.BookingDetailsPage.CancelReason2);
            _browsers[_c.CurrentUser.Key].Click(BookingDetailsPage.ConfirmCancelButton);
        }

        [Then(@"an error message is displayed for the details box and hearing is not cancelled")]
        public void ThenAnErrorMessageIsDisplayedForTheDetailsBoxAndHearingIsNotCancelled()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.CancelReasonDetailsErrorLabel).Displayed.Should().BeTrue();
            PollForHearingStatus(BookingStatus.Cancelled).Should().BeFalse();
            _browsers[_c.CurrentUser.Key].Click(BookingDetailsPage.KeepBookingButton);
        }

        [Then(@"the hearing is cancelled")]
        public void ThenTheHearingIsCancelled()
        {
            PollForHearingStatus(BookingStatus.Cancelled).Should().BeTrue();
        }

        [Then(@"the conference is deleted")]
        public void ThenTheConferenceIsDeleted()
        {
            var hearing = GetHearing();
            _c.Apis.VideoApi.PollForConferenceDeleted(hearing.Id, Timeout).Should().BeTrue();
        }

        [When(@"the user cancels the hearing with other reason and detail text")]
        public void WhenTheUserCancelsTheHearingWithOtherReasonAndDetailText()
        {
            _browsers[_c.CurrentUser.Key].ScrollTo(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser.Key].Click(BookingDetailsPage.CancelButton);

            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver,
                BookingDetailsPage.CancelReasonDropdown, _c.Test.TestData.BookingDetailsPage.CancelReason2);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingDetailsPage.CancelReasonTextfield).SendKeys(_c.Test.TestData.BookingDetailsPage.DetailReason);
            _browsers[_c.CurrentUser.Key].Click(BookingDetailsPage.ConfirmCancelButton);
        }

        private HearingDetailsResponse GetHearing()
        {
            var clerkUsername = UserManager.GetClerkUser(_c.UserAccounts).Username;
            var hearingResponse = _c.Apis.BookingsApi.GetHearingsForUsername(clerkUsername);
            var hearings = RequestHelper.DeserialiseSnakeCaseJsonToResponse<List<HearingDetailsResponse>>(hearingResponse.Content);
            return hearings.First(x => x.Cases.First().Name.Equals(_c.Test.HearingDetails.CaseName));
        }

        private bool PollForHearingStatus(BookingStatus expectedStatus)
        {
            for (var i = 0; i < Timeout; i++)
            {
                var hearing = GetHearing();
                if (hearing.Status.Equals(expectedStatus))
                {
                    return true;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            return false;
        }

        public void ClickEdit()
        {
            _browsers[_c.CurrentUser.Key].ScrollTo(BookingDetailsPage.EditButton);
            _browsers[_c.CurrentUser.Key].Click(BookingDetailsPage.EditButton);
        }
    }
}
