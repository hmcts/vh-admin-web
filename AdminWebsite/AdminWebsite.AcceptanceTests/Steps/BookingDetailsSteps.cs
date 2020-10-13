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
    public class BookingDetailsSteps : ISteps
    {
        private const int Timeout = 60;
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly CommonSharedSteps _commonSharedSteps;

        public BookingDetailsSteps(TestContext testContext, Dictionary<User, UserBrowser> browsers, CommonSharedSteps commonSharedSteps)
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
            foreach (var hearing in GetHearings())
            {
                PollForHearingStatus(BookingStatus.Booked, hearing.Id);
            }

            VerifyTheBookingDetails();
            VerifyJudgeInParticipantsList();
            VerifyTheParticipantDetails();
        }

        private void VerifyTheBookingDetails()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CaseNumberTitle).Text.Should().Be(_c.Test.HearingDetails.CaseNumber);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CreatedBy).Text.Should().Be(_c.Test.CreatedBy);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CreatedDate).Text.Should().NotBeNullOrWhiteSpace();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CaseNumber).Text.Should().Be(_c.Test.HearingDetails.CaseNumber);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CaseName).Text.Should().Contain(_c.Test.HearingDetails.CaseName);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CaseType).Text.Should().Be(_c.Test.HearingDetails.CaseType.Name);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.HearingType).Text.Should().Be(_c.Test.HearingDetails.HearingType.Name);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CourtroomAddress).Text.Should().Be($"{_c.Test.HearingSchedule.HearingVenue}, {_c.Test.HearingSchedule.Room}");
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.AudioRecorded).Text.Should().Be(_c.Test.AssignJudge.AudioRecord ? "Yes" : "No");
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.OtherInformation).Text.Should().Be(_c.Test.OtherInformation);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.VideoAccessPoints(0)).Text.Should().Be(_c.Test.VideoAccessPoints.DisplayName);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.HearingStartDate).Text.ToLower().Should().Be(_c.Test.HearingSchedule.ScheduledDate.ToLocalTime().ToString(DateFormats.HearingSummaryDate).ToLower());

            var expectedDuration = _c.Test.HearingSchedule.MultiDays ? "listed for 8 hours" : $"listed for {_c.Test.HearingSchedule.DurationMinutes} minutes";
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.Duration).Text.Should().Contain(expectedDuration);
        }

        private void VerifyJudgeInParticipantsList()
        {
            var hearings = GetHearings();
            var hearing = GetTheFirstHearing(hearings);
            var hearingJudge = hearing.Participants.First(x => x.User_role_name.Equals("Judge"));
            var judge = UserManager.GetJudgeUser(_c.Test.HearingParticipants);

            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.JudgeName).Text.Should().Contain(judge.DisplayName);

            if (!OnlyDisplayEmailAndUsernameIfCurrentUserMadeTheBooking()) return;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantEmail(hearingJudge.Id)).Text.Should().Be(judge.AlternativeEmail);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantUsername(hearingJudge.Id)).Text.Should().Be(judge.Username);
        }

        private bool OnlyDisplayEmailAndUsernameIfCurrentUserMadeTheBooking()
        {
            return _c.CurrentUser.Username.Equals(_c.Test.CreatedBy);
        }

        private void VerifyTheParticipantDetails()
        {
            var hearings = GetHearings();
            var hearing = GetTheFirstHearing(hearings);

            foreach (var participant in hearing.Participants)
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
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantEmail(participant.Id)).Text.Trim().Should().Be(participant.Contact_email);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantUsername(participant.Id)).Text.Trim().Should().Be(participant.Username);
            }
        }


        private static HearingDetailsResponse GetTheFirstHearing(List<HearingDetailsResponse> hearings)
        {
            return hearings.Count == 1 ? hearings.First() : hearings.First(x => x.Cases.First().Name.Contains("1 of"));
        }

        private void VerifyJudgeDetails(ParticipantResponse participant)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.JudgeName).Text.Trim().Should().Contain(participant.Display_name);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.JudgeRole).Text.Trim().Should().Be(participant.User_role_name);
        }

        private void VerifyParticipant(ParticipantResponse participant)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantName(participant.Id)).Text.Trim().Should().Contain($"{_c.Test.TestData.AddParticipant.Participant.Title} {participant.First_name} {participant.Last_name}");
            if (participant.User_role_name.Equals("Representative"))
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantRepresentee(participant.Id)).Text.Trim().Should().Be(participant.Representee);
            }
            else
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.ParticipantRole(participant.Id)).Text.Trim().Should().Be(participant.Hearing_role_name);
            }
        }

        [When(@"the user confirms the booking")]
        public void WhenTheUserConfirmsTheBooking()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.ConfirmButton);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.ConfirmButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.ConfirmButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.ConfirmedLabel);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.ConfirmedLabel);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.ConfirmedLabel).Displayed.Should().BeTrue();
        }

        [Then(@"the hearing is available in video web")]
        [Then(@"the first hearing is available in video web")]
        public void ThenTheHearingIsAvailableInTheVideoWeb()
        {
            var hearings = GetHearings();
            var hearing = GetTheFirstHearing(hearings);
            PollForHearingStatus(BookingStatus.Created, hearing.Id).Should().BeTrue();
            _c.Api.PollForConferenceExists(hearing.Id).Should().BeTrue();
        }

        [When(@"the user cancels the hearing without a cancel reason")]
        public void WhenTheUserCancelsTheHearingWithoutACancelReason()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.ConfirmCancelButton);
        }

        [Then(@"an error message is displayed and hearing is not cancelled")]
        public void ThenAnErrorMessageIsDisplayedAndHearingIsNotCancelled()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelReasonDropdownErrorLabel).Displayed.Should().BeTrue();

            foreach (var hearing in GetHearings())
            {
                PollForHearingStatus(BookingStatus.Cancelled, hearing.Id).Should().BeFalse();
            }

            _browsers[_c.CurrentUser].Click(BookingDetailsPage.KeepBookingButton);
        }

        [When(@"the user cancels the hearing")]
        public void WhenTheUserAttemptsToCancelTheHearing()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.CancelButton);

            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver,
                BookingDetailsPage.CancelReasonDropdown, _c.Test.TestData.BookingDetailsPage.CancelReason);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.ConfirmCancelButton);
        }

        [When(@"the user cancels the hearing with other reason and no text")]
        public void WhenTheUserCancelsTheHearingWithOtherReason()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.CancelButton);

            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver,
                BookingDetailsPage.CancelReasonDropdown, _c.Test.TestData.BookingDetailsPage.CancelReason2);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.ConfirmCancelButton);
        }

        [Then(@"an error message is displayed for the details box and hearing is not cancelled")]
        public void ThenAnErrorMessageIsDisplayedForTheDetailsBoxAndHearingIsNotCancelled()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelReasonDetailsErrorLabel).Displayed.Should().BeTrue();

            foreach (var hearing in GetHearings())
            {
                PollForHearingStatus(BookingStatus.Cancelled, hearing.Id).Should().BeFalse();
            }

            _browsers[_c.CurrentUser].Click(BookingDetailsPage.KeepBookingButton);
        }

        [Then(@"the hearing is cancelled")]
        public void ThenTheHearingIsCancelled()
        {
            foreach (var hearing in GetHearings())
            {
                PollForHearingStatus(BookingStatus.Cancelled, hearing.Id).Should().BeTrue();
            }
        }

        [Then(@"the conference is deleted")]
        public void ThenTheConferenceIsDeleted()
        {
            foreach (var hearing in GetHearings())
            {
                _c.Api.PollForConferenceDeleted(hearing.Id, Timeout).Should().BeTrue();
            }
        }

        [When(@"the user cancels the hearing with other reason and detail text")]
        public void WhenTheUserCancelsTheHearingWithOtherReasonAndDetailText()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.CancelButton);

            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver,
                BookingDetailsPage.CancelReasonDropdown, _c.Test.TestData.BookingDetailsPage.CancelReason2);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelReasonTextfield).SendKeys(_c.Test.TestData.BookingDetailsPage.DetailReason);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.ConfirmCancelButton);
        }

        private HearingDetailsResponse GetHearing(Guid hearingId)
        {
            var response = _c.Api.GetHearing(hearingId);
            return RequestHelper.Deserialise<HearingDetailsResponse>(response.Content);
        }

        private List<HearingDetailsResponse> GetHearings()
        {
            var judgeUsername = Users.GetJudgeUser(_c.Users).Username;
            var hearingResponse = _c.Api.GetHearingsByUsername(judgeUsername);
            var allHearings = RequestHelper.Deserialise<List<HearingDetailsResponse>>(hearingResponse.Content);
            var hearings = allHearings.Where(hearing => hearing.Cases.First().Name.Contains(_c.Test.HearingDetails.CaseName)).ToList();

            if (hearings.Count == 0)
            {
                throw new DataException($"No hearings were found containing case name '{_c.Test.HearingDetails.CaseName}'");
            }

            return hearings;
        }

        private bool PollForHearingStatus(BookingStatus expectedStatus, Guid hearingId)
        {
            for (var i = 0; i < Timeout; i++)
            {
                var hearing = GetHearing(hearingId);
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
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.EditButton);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.EditButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.EditButton);
        }
    }
}
