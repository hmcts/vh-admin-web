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
using AdminWebsite.Extensions;
using AdminWebsite.Models;
using BookingsApi.Contract.Enums;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using TechTalk.SpecFlow;
using TestApi.Contract.Dtos;
using VideoApi.Contract.Responses;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class BookingDetailsSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly CommonSharedSteps _commonSharedSteps;
        private readonly BookingsListSteps _bookingsListSteps;

        public BookingDetailsSteps(TestContext testContext, Dictionary<UserDto, UserBrowser> browsers, CommonSharedSteps commonSharedSteps, BookingsListSteps bookingsListSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _commonSharedSteps = commonSharedSteps;
            _bookingsListSteps = bookingsListSteps;
        }

        public void ProgressToNextPage()
        {
            WhenTheUserConfirmsTheBooking();
            ThenTheHearingIsAvailableInTheVideoWeb();
            ThenTheConferenceMatchesTheHearing();
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
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.CaseNumberTitle).Should().Be(_c.Test.HearingDetails.CaseNumber);
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.CreatedBy).Should().Be(_c.Test.CreatedBy);
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.CreatedDate).Should().NotBeNullOrWhiteSpace();
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.CaseNumber).Should().Be(_c.Test.HearingDetails.CaseNumber);
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.CaseName).Should().Contain(_c.Test.HearingDetails.CaseName);
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.CaseType).Should().Be(_c.Test.HearingDetails.CaseType.Name);
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.HearingType).Should().Be(_c.Test.HearingDetails.HearingType.Name);
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.CourtroomAddress).Should().Be($"{_c.Test.HearingSchedule.HearingVenue}, {_c.Test.HearingSchedule.Room}");
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.AudioRecorded).Should().Be("Yes");
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.OtherInformation).Should().Be(OtherInformationSteps.GetOtherInfo(_c.Test.TestData.OtherInformationDetails.OtherInformation));
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.VideoAccessPoints(0)).Should().Be(_c.Test.VideoAccessPoints.DisplayName);
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.HearingStartDate).ToLower().Should().Be(_c.Test.HearingSchedule.ScheduledDate.ToLocalTime().ToString(DateFormats.HearingSummaryDate).ToLower());

            var expectedDuration = _c.Test.HearingSchedule.MultiDays ? "listed for 8 hours" : $"listed for {_c.Test.HearingSchedule.DurationMinutes} minutes";
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.Duration).Should().Contain(expectedDuration);
        }

        private void VerifyJudgeInParticipantsList()
        {
            var hearings = GetHearings();
            var hearing = GetTheFirstHearing(hearings);
            var hearingJudge = hearing.Participants.First(x => x.UserRoleName.Equals("Judge"));
            var judge = UserManager.GetJudgeUser(_c.Test.HearingParticipants);

            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.JudgeName).Should().Contain(judge.DisplayName);

            if (!OnlyDisplayEmailAndUsernameIfCurrentUserMadeTheBooking()) return;
            if (GetJudgeEmail(hearing) != null)
            {
                _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.ParticipantEmail(hearingJudge.Id)).Should().Be(judge.AlternativeEmail);
            }
            else
            {
                _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.ParticipantEmail(hearingJudge.Id)).Should().Be("TBC");
            }
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.ParticipantUsername(hearingJudge.Id)).Should().Be(judge.Username);
        }

        private string GetJudgeEmail(HearingDetailsResponse hearing)
        {
            var judge = hearing.Participants.SingleOrDefault(x =>
                    x.UserRoleName.Contains("Judge", StringComparison.CurrentCultureIgnoreCase));
            if (judge != null && judge.ContactEmail.Contains("judiciary", StringComparison.CurrentCultureIgnoreCase))
            {
                return judge.ContactEmail;
            }
            if (hearing.IsJudgeEmailEJud())
            {
                var judge = hearing.Participants.Single(x =>
                    x.UserRoleName.Contains("Judge", StringComparison.CurrentCultureIgnoreCase));
                return judge.ContactEmail;
            }

            var email = GetOtherInformationObject(hearing.OtherInformation).JudgeEmail;
            return email == string.Empty ? null : email;
        }
        
        private static OtherInformationDetails GetOtherInformationObject(string otherInformation)
        {
            try
            {
                var properties = otherInformation.Split("|");
                return new OtherInformationDetails
                {
                    JudgeEmail = properties[2],
                    JudgePhone = properties[4],
                    OtherInformation = properties[6]
                };
            }
            catch (Exception)
            {
                var properties = otherInformation.Split("|");
                return properties.Length > 2 ? new OtherInformationDetails {OtherInformation = properties[2]} : new OtherInformationDetails {OtherInformation = properties[0]};
            }
        }

        private static HearingDetailsResponse GetTheFirstHearing(IReadOnlyCollection<HearingDetailsResponse> hearings)
        {
            return hearings.Count == 1 ? hearings.First() : hearings.First(x => x.Cases.First().Name.Contains("1 of"));
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
                if (participant.UserRoleName.Equals("Judge"))
                {
                    VerifyJudgeDetails(participant);
                }
                else
                {
                    VerifyParticipant(participant);
                }

                if (!OnlyDisplayEmailAndUsernameIfCurrentUserMadeTheBooking()) continue;
                if (participant.HearingRoleName.ToLower() == "judge" && GetJudgeEmail(hearing) == null)
                {
                    _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.ParticipantEmail(participant.Id)).Should().Be("TBC");
                }
                else
                {
                    _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.ParticipantEmail(participant.Id)).Should().Be(participant.ContactEmail);
                }
                _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.ParticipantUsername(participant.Id)).Should().Be(participant.Username);
            }
        }

        private void VerifyJudgeDetails(ParticipantResponse participant)
        {
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.JudgeName).Should().Contain(participant.DisplayName);
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.JudgeRole).Should().Be(participant.UserRoleName);
        }

        private void VerifyParticipant(ParticipantResponse participant)
        {
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.ParticipantName(participant.Id)).Should().Contain($"{_c.Test.TestData.AddParticipant.Participant.Title} {participant.FirstName} {participant.LastName}");
            if (participant.UserRoleName.Equals("Representative"))
            {
                _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.ParticipantRepresentee(participant.Id)).Should().Be(participant.Representee);
            }
            else
            {
                _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.ParticipantRole(participant.Id)).Should().Be(participant.HearingRoleName);
            }
            _browsers[_c.CurrentUser].TextOf(BookingDetailsPage.ParticipantPhone(participant.Id)).Should().Be(participant.TelephoneNumber);
        }

        [When(@"the user confirms the hearing")]
        public void WhenTheUserConfirmsTheBooking()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.ConfirmButton);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.ConfirmButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.ConfirmButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.ConfirmedLabel);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.ConfirmedLabel);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.ConfirmedLabel).Displayed.Should().BeTrue();
        }

        [When(@"the user confirms all the hearings")]
        public void WhenTheUserConfirmsAllTheBookings()
        {
            foreach (var hearing in GetHearings())
            {
                _browsers[_c.CurrentUser].Click(CommonAdminWebPage.BookingsListLink);
                _bookingsListSteps.SelectsBookingByCaseName(hearing.Cases.First().Name);
                WhenTheUserConfirmsTheBooking();
            }
        }
        
        [Then(@"the hearing is available in video web")]
        public void ThenTheHearingIsAvailableInTheVideoWeb()
        {
            var hearings = GetHearings();
            var hearing = hearings.First();

            PollForHearingStatus(BookingStatus.Created, hearing.Id).Should().BeTrue();
            PollForConferenceInVideoApi(hearing.Id);
        }

        [Then(@"the hearings are available in video web")]
        public void ThenTheHearingsAreAvailableInTheVideoWeb()
        {
            foreach (var hearing in GetHearings())
            {
                PollForHearingStatus(BookingStatus.Created, hearing.Id).Should().BeTrue();
                PollForConferenceInVideoApi(hearing.Id);
            }
        }

        private ConferenceDetailsResponse PollForConferenceInVideoApi(Guid hearingId)
        {
            const int DELAY = 2;
            const int FIND_CONFERENCE_TIMEOUT = 30;

            for (var i = 0; i < FIND_CONFERENCE_TIMEOUT; i++)
            {
                var response = _c.Api.GetConferenceByHearingId(hearingId);
                if (response.IsSuccessful)
                {
                    return RequestHelper.Deserialise<ConferenceDetailsResponse>(response.Content);
                }
                Thread.Sleep(TimeSpan.FromSeconds(DELAY));
            }

            throw new DataException($"Conference could not be found in Video Api after {FIND_CONFERENCE_TIMEOUT * DELAY} seconds");
        }

        [Then(@"the conference details match the hearing")]
        public void ThenTheConferenceMatchesTheHearing()
        {
            foreach (var hearing in GetHearings())
            {
                var conference = PollForConferenceInVideoApi(hearing.Id);
                AssertConference.Assert(hearing, conference);
            }
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
                _c.Api.PollForConferenceDeleted(hearing.Id).Should().BeTrue();
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
            const int POLL_FOR_HEARING_STATUS_TIMEOUT = 60;

            for (var i = 0; i < POLL_FOR_HEARING_STATUS_TIMEOUT; i++)
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
