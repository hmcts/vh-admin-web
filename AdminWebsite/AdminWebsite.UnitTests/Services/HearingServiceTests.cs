using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Services;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using Moq;
using NotificationApi.Client;
using NotificationApi.Contract.Requests;
using NUnit.Framework;

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
        public async Task should_send_confirmation_email_to_all_participants_except_a_judge()
        {
            var judge = _hearing.Participants.First(x => x.User_role_name == "Judge");
            await _service.SendHearingConfirmationEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.ParticipantId != judge.Id)),
                    Times.Exactly(3));
        }

        [Test]
        public async Task should_not_send_confirmation_email_when_hearing_is_generic_case_type()
        {
            _hearing.Case_type_name = "Generic";
            var judge = _hearing.Participants.First(x => x.User_role_name == "Judge");
            await _service.SendHearingConfirmationEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.ParticipantId != judge.Id)),
                    Times.Never);
        }
        
        [Test]
        public async Task should_send_amendment_email_to_all_participants_except_a_judge()
        {
            var judge = _hearing.Participants.First(x => x.User_role_name == "Judge");
            var secondHearing = InitHearing();
            secondHearing.Scheduled_date_time = _hearing.Scheduled_date_time.AddDays(1).AddHours(3).AddMinutes(20);
            await _service.SendHearingUpdateEmail(_hearing, secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.ParticipantId != judge.Id)),
                    Times.Exactly(3));
        }

        [Test]
        public async Task should_not_send_amendment_email_when_hearing_is_generic_case_type()
        {
            var judge = _hearing.Participants.First(x => x.User_role_name == "Judge");
            var secondHearing = InitHearing();
            _hearing.Case_type_name = "Generic";
            secondHearing.Case_type_name = "Generic";
            secondHearing.Scheduled_date_time = _hearing.Scheduled_date_time.AddDays(1).AddHours(3).AddMinutes(20);
            await _service.SendHearingUpdateEmail(_hearing, secondHearing);

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
                .With(x => x.User_role_name = "Representative")
                .Build();
            var ind = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Individual")
                .Build();
            var joh = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Judicial Office Holder")
                .Build();
            var judge = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Judge")
                .Build();
            return Builder<HearingDetailsResponse>.CreateNew().With(h => h.Participants =
                    new List<ParticipantResponse>
                    {
                        rep, ind, joh, judge
                    })
                .With(x => x.Cases = cases).Build();
        }
    }
}