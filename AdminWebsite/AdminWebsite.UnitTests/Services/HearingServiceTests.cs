using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Extensions;
using AdminWebsite.Models;
using AdminWebsite.Services;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.Responses;
using FizzWare.NBuilder;
using Moq;
using Newtonsoft.Json;
using NotificationApi.Client;
using NotificationApi.Contract;
using NotificationApi.Contract.Requests;
using NUnit.Framework;
using CaseResponse = BookingsApi.Contract.Responses.CaseResponse;

namespace AdminWebsite.UnitTests.Services
{
    public class HearingServiceTests
    {
        private AutoMock _mocker;
        private HearingsService _service;
        private HearingDetailsResponse _hearing;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _service = _mocker.Create<HearingsService>();
            _hearing = InitHearing();
        }

        [Test]
        public async Task should_send_confirmation_email_to_all_participants_except_judge()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            await _service.SendHearingConfirmationEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.ParticipantId != judge.Id)),
                    Times.Exactly(3));
        }

        [Test]
        public async Task should_not_send_confirmation_email_when_hearing_is_generic_case_type()
        {
            _hearing.CaseTypeName = "Generic";
            await _service.SendHearingConfirmationEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                    Times.Never);
        }
        
        [Test]
        public async Task should_send_amendment_email_to_all_participants_except_a_judge_if_no_email_exists()
        {
            _hearing.OtherInformation = JsonConvert.SerializeObject(new OtherInformationDetails {JudgeEmail = null});

            var secondHearing = InitHearing();
            secondHearing.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1).AddHours(3).AddMinutes(20);
            await _service.SendHearingUpdateEmail(_hearing, secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                    Times.Exactly(secondHearing.Participants.Count(x => x.UserRoleName.ToLower() != "judge")));
        }

        [Test]
        public async Task should_send_amendment_email_to_all_participants()
        {
            var secondHearing = InitHearing();
            _hearing.GroupId = secondHearing.GroupId = _hearing.Id;

            secondHearing.OtherInformation =
                new OtherInformationDetails {JudgeEmail = "judge@hmcts.net"}.ToOtherInformationString();
            secondHearing.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1).AddHours(3).AddMinutes(20);
            await _service.SendHearingUpdateEmail(_hearing, secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                    Times.Exactly(secondHearing.Participants.Count));
        }
        
        [Test]
        public async Task should_send_amendment_email_to_all_participants_except_judge_when_not_the_first_hearing()
        {
            var secondHearing = InitHearing();
            _hearing.GroupId = secondHearing.GroupId = _hearing.Id;

            secondHearing.OtherInformation =
                new OtherInformationDetails {JudgeEmail = "judge@hmcts.net"}.ToOtherInformationString();
            secondHearing.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1).AddHours(3).AddMinutes(20);
            await _service.SendHearingUpdateEmail(secondHearing, secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                    Times.Exactly(secondHearing.Participants.Count -1));
            
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationJudgeMultiDay)),
                    Times.Never);
        }

        [Test]
        public async Task should_send_confirmation_email_to_new_judge_when_amending_judge_email()
        {
            var secondHearing = InitHearing();
            secondHearing.OtherInformation = new OtherInformationDetails {JudgeEmail = "judge@hmcts.net"}.ToOtherInformationString();
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value)).ReturnsAsync(new List<HearingDetailsResponse> {_hearing});
            
            await _service.SendJudgeConfirmationEmail(secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                    Times.Exactly(1));
        }
        
        [Test]
        public async Task should_not_send_confirmation_email_when_hearing_is_not_the_first_hearing_of_a_mdh()
        {
            var secondHearing = InitHearing();
            _hearing.GroupId = secondHearing.GroupId = _hearing.Id;
            secondHearing.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1).AddHours(3).AddMinutes(20);
            
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value)).ReturnsAsync(new List<HearingDetailsResponse> {_hearing, secondHearing});
            
            await _service.SendJudgeConfirmationEmail(secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                    Times.Never);
        }

        [Test]
        public async Task should_send_multiday_confirmation_email_to_all_participants_except_judge()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            await _service.SendMultiDayHearingConfirmationEmail(_hearing, 2);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.ParticipantId != judge.Id)),
                    Times.Exactly(_hearing.Participants.Count(x => x.UserRoleName.ToLower() != "judge")));
        }
        
        [Test]
        public async Task should_not_send_amendment_email_when_hearing_is_generic_case_type()
        {
            var secondHearing = InitHearing();
            _hearing.CaseTypeName = "Generic";
            secondHearing.CaseTypeName = "Generic";
            secondHearing.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1).AddHours(3).AddMinutes(20);
            await _service.SendHearingUpdateEmail(_hearing, secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                    Times.Never);
        }
        
        [Test]
        public async Task should_send_reminder_email_to_all_participants_except_a_judge()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.ParticipantId != judge.Id)),
                    Times.Exactly(3));
        }
        
        [Test]
        public async Task should_send_confirmation_email_to_judge_when_reminder_is_sent_to_participants()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            _hearing.OtherInformation = new OtherInformationDetails {JudgeEmail = "judge@hmcts.net"}.ToOtherInformationString();
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value)).ReturnsAsync(new List<HearingDetailsResponse> {_hearing});
            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(
                        r => r.ParticipantId == judge.Id && r.NotificationType == NotificationType.HearingConfirmationJudge)),
                    Times.Exactly(1));
        }
        
        [Test]
        public async Task should_send_confirmation_email_to_judge_when_reminder_is_sent_to_participants_for_multi_day_hearing()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            _hearing.OtherInformation = new OtherInformationDetails {JudgeEmail = "judge@hmcts.net"}.ToOtherInformationString();
            var hearing2 = InitHearing();
            _hearing.GroupId = _hearing.Id;
            hearing2.GroupId = _hearing.GroupId;
            _hearing.Cases[0].Name = "Day 1 of 2 Confirming a hearing";
            hearing2.Cases[0].Name = "Day 2 of 2 Confirming a hearing";
            hearing2.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1);
            var listOfHearings = new List<HearingDetailsResponse> {_hearing, hearing2};
            listOfHearings = listOfHearings.OrderBy(x => x.ScheduledDateTime).ToList();
            
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(listOfHearings);

            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(
                        r => r.ParticipantId == judge.Id && r.NotificationType == NotificationType.HearingConfirmationJudgeMultiDay)),
                    Times.Exactly(1));
        }
        
        [Test]
        public async Task should_not_send_confirmation_email_to_judge_when_reminder_is_sent_to_participants_for_multi_day_hearing_and_is_not_the_main_hearing()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            _hearing.OtherInformation = new OtherInformationDetails {JudgeEmail = "judge@hmcts.net"}.ToOtherInformationString();
            var hearing2 = InitHearing();
            _hearing.GroupId = _hearing.Id;
            hearing2.GroupId = _hearing.GroupId;
            _hearing.Cases[0].Name = "Day 1 of 2 Confirming a hearing";
            hearing2.Cases[0].Name = "Day 2 of 2 Confirming a hearing";
            hearing2.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1);
            var listOfHearings = new List<HearingDetailsResponse> {_hearing, hearing2};
            listOfHearings = listOfHearings.OrderBy(x => x.ScheduledDateTime).ToList();
            
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(listOfHearings);

            await _service.SendHearingReminderEmail(hearing2);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(
                        r => r.ParticipantId == judge.Id && r.NotificationType == NotificationType.HearingConfirmationJudgeMultiDay)),
                    Times.Never);
        }
        
        [Test]
        public async Task should_not_send_confirmation_email_to_judge_when_reminder_is_sent_to_participants_if_no_judge_email_exists()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            _hearing.OtherInformation = new OtherInformationDetails {JudgeEmail = null}.ToOtherInformationString();
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value)).ReturnsAsync(new List<HearingDetailsResponse> {_hearing});
            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.ParticipantId == judge.Id)),
                    Times.Exactly(0));
        }

        [Test]
        public async Task should_not_send_reminder_email_when_hearing_is_generic_case_type()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            _hearing.CaseTypeName = "Generic";
            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.ParticipantId != judge.Id)),
                    Times.Never);
        }

        private HearingDetailsResponse InitHearing()
        {
            var cases = new List<CaseResponse>
            {
                new CaseResponse {Name = "Test", Number = "123456"}
            };
            var rep = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Representative")
                .Build();
            var ind = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Individual")
                .Build();
            var joh = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Judicial Office Holder")
                .Build();
            var judge = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Judge")
                .Build();
            return Builder<HearingDetailsResponse>.CreateNew().With(h => h.Participants =
                    new List<ParticipantResponse>
                    {
                        rep, ind, joh, judge
                    })
                .With(x => x.Cases = cases)
                .With(x => x.Id = Guid.NewGuid()).Build();
        }
    }
}