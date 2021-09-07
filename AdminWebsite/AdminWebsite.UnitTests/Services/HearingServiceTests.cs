using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Extensions;
using AdminWebsite.Helper;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Services;
using AdminWebsite.Services.Models;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using NotificationApi.Client;
using NotificationApi.Contract;
using NotificationApi.Contract.Requests;
using NUnit.Framework;
using VideoApi.Contract.Responses;
using CaseResponse = BookingsApi.Contract.Responses.CaseResponse;
using EndpointResponse = BookingsApi.Contract.Responses.EndpointResponse;

namespace AdminWebsite.UnitTests.Services
{
    public class HearingServiceTests
    {
        private AutoMock _mocker;
        private HearingsService _service;
        private HearingDetailsResponse _hearing;
        private const string _expectedTeleConferencePhoneNumber = "expected_conference_phone_number";
        private const string _expectedTeleConferenceId = "expected_conference_phone_id";

        private HearingDetailsResponse _updatedExistingParticipantHearingOriginal;
        private Guid _validId;
        private EditHearingRequest _editHearingRequest;
        List<CaseResponse> _cases;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IOptions<KinlyConfiguration>>().Setup(opt => opt.Value).Returns(new KinlyConfiguration()
            {
                ConferencePhoneNumber = _expectedTeleConferencePhoneNumber
            });

            _mocker.Mock<IConferenceDetailsService>()
                .Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
                .ReturnsAsync(new ConferenceDetailsResponse
                {
                    MeetingRoom = new MeetingRoomResponse
                    {
                        AdminUri = "AdminUri",
                        JudgeUri = "JudgeUri",
                        ParticipantUri = "ParticipantUri",
                        PexipNode = "PexipNode",
                        PexipSelfTestNode = "PexipSelfTestNode",
                        TelephoneConferenceId = _expectedTeleConferenceId
                    }
                });
            _mocker.Mock<IBookingsApiClient>()
                .Setup(c => c.GetHearingsByGroupIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(new List<HearingDetailsResponse> { _hearing });

            _service = _mocker.Create<HearingsService>();
            _hearing = InitHearing();
            _validId = Guid.NewGuid();

            _cases = new List<CaseResponse> { new CaseResponse { Name = "Case", Number = "123" } };

            _updatedExistingParticipantHearingOriginal = new HearingDetailsResponse
            {
                Id = _validId,
                GroupId = _validId,
                Participants =
                    new List<ParticipantResponse>
                    {
                        new ParticipantResponse
                        {
                            Id = Guid.NewGuid(),
                            UserRoleName = "Individual",
                            ContactEmail = "old@hmcts.net",
                            Username = "old@hmcts.net"
                        }
                    },
                Cases = _cases,
                CaseTypeName = "Unit Test",
                ScheduledDateTime = DateTime.UtcNow.AddHours(3),
                Endpoints = new List<EndpointResponse>
                {
                    new EndpointResponse
                    {
                        Id = Guid.NewGuid(), DisplayName = "test", DefenceAdvocateId = Guid.NewGuid(),
                    }
                }
            };

            _editHearingRequest = new EditHearingRequest
            {
                HearingRoomName = _updatedExistingParticipantHearingOriginal.HearingRoomName,
                HearingVenueName = _updatedExistingParticipantHearingOriginal.HearingVenueName,
                OtherInformation = _updatedExistingParticipantHearingOriginal.OtherInformation,
                ScheduledDateTime = _updatedExistingParticipantHearingOriginal.ScheduledDateTime,
                ScheduledDuration = _updatedExistingParticipantHearingOriginal.ScheduledDuration,
                QuestionnaireNotRequired = _updatedExistingParticipantHearingOriginal.QuestionnaireNotRequired,
                AudioRecordingRequired = _updatedExistingParticipantHearingOriginal.AudioRecordingRequired,
                Case = new EditCaseRequest
                {
                    Name = _updatedExistingParticipantHearingOriginal.Cases.First().Name,
                    Number = _updatedExistingParticipantHearingOriginal.Cases.First().Number,
                },
                Endpoints = _updatedExistingParticipantHearingOriginal.Endpoints
                    .Select(EditEndpointRequestMapper.MapFrom)
                    .ToList(),
                Participants = _updatedExistingParticipantHearingOriginal.Participants
                    .Select(EditParticipantRequestMapper.MapFrom)
                    .ToList()
            };
        }

        [Test]
        public async Task Should_send_amendment_email_to_all_participants_except_a_judge_if_no_email_exists()
        {
            _hearing.OtherInformation = JsonConvert.SerializeObject(new OtherInformationDetails { JudgeEmail = null });

            var secondHearing = InitHearing();
            secondHearing.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1).AddHours(3).AddMinutes(20);
            await _service.SendHearingUpdateEmail(_hearing, secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                    Times.Exactly(secondHearing.Participants.Count(x => x.UserRoleName.ToLower() != "judge")));
        }

        [Test]
        public async Task Should_send_amendment_email_to_all_participants()
        {
            var secondHearing = InitHearing();
            _hearing.GroupId = secondHearing.GroupId = _hearing.Id;

            secondHearing.OtherInformation =
                new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" }.ToOtherInformationString();
            secondHearing.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1).AddHours(3).AddMinutes(20);
            await _service.SendHearingUpdateEmail(_hearing, secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                    Times.Exactly(secondHearing.Participants.Count));
        }

        [Test]
        public async Task Should_send_amendment_email_to_all_participants_except_judge_when_not_the_first_hearing()
        {
            var secondHearing = InitHearing();
            _hearing.GroupId = secondHearing.GroupId = _hearing.Id;

            secondHearing.OtherInformation =
                new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" }.ToOtherInformationString();
            secondHearing.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1).AddHours(3).AddMinutes(20);
            await _service.SendHearingUpdateEmail(secondHearing, secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                    Times.Exactly(secondHearing.Participants.Count - 1));

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r =>
                        r.NotificationType == NotificationType.HearingConfirmationJudgeMultiDay)), Times.Never);
        }

        [Test]
        public async Task Should_send_confirmation_email_to_new_judge_when_amending_judge_email()
        {
            var secondHearing = InitHearing();
            secondHearing.OtherInformation =
                new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" }.ToOtherInformationString();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> { _hearing });

            await _service.SendJudgeConfirmationEmail(secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Exactly(1));
        }

        [Test]
        public async Task Should_not_send_confirmation_email_when_hearing_is_not_the_first_hearing_of_a_mdh()
        {
            var secondHearing = InitHearing();
            _hearing.GroupId = secondHearing.GroupId = _hearing.Id;
            secondHearing.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1).AddHours(3).AddMinutes(20);

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> { _hearing, secondHearing });

            await _service.SendJudgeConfirmationEmail(secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Never);
        }

        [Test]
        public async Task Should_send_multiday_confirmation_email_to_all_participants_except_judge()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            var expectedTimes = _hearing.Participants.Where(x => x.UserRoleName.ToLower() != "judge")
                .Where(y => y.UserRoleName.ToLower() != "staff member").Count() +
                                _hearing.TelephoneParticipants.Count(p => p.HearingRoleName != "Judge");

            await _service.SendMultiDayHearingConfirmationEmail(_hearing, 2);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.ParticipantId != judge.Id)),
                    Times.Exactly(expectedTimes));
        }

        [Test]
        public async Task Should_not_send_amendment_email_when_hearing_is_generic_case_type()
        {
            var secondHearing = InitHearing();
            _hearing.CaseTypeName = "Generic";
            secondHearing.CaseTypeName = "Generic";
            secondHearing.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1).AddHours(3).AddMinutes(20);
            await _service.SendHearingUpdateEmail(_hearing, secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Never);
        }

        [Test]
        public async Task Should_send_reminder_email_to_all_participants_except_a_judge()
        {
            _hearing.OtherInformation =
                new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" }.ToOtherInformationString();
            
            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                    Times.Exactly(5));
            _mocker.Mock<INotificationApiClient>()
               .Verify(
                   x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingReminderJoh)),
                   Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingReminderLip)),
                    Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingReminderRepresentative)),
                    Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationStaffMember)),
                    Times.Once);
            _mocker.Mock<INotificationApiClient>()
              .Verify(
                  x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationJudge)),
                  Times.Once);
        }

        [Test]
        public async Task SendHearingReminderEmail_Should_Receive_MultiDay_Confirmation_For_StaffMember()
        {
            var hearing2 = InitHearing();
            _hearing.GroupId = _hearing.Id;
            hearing2.GroupId = _hearing.GroupId;
            _hearing.Cases[0].Name = "Day 1 of 2 Confirming a hearing";
            hearing2.Cases[0].Name = "Day 2 of 2 Confirming a hearing";
            hearing2.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1);
            var listOfHearings = new List<HearingDetailsResponse> { _hearing, hearing2 };
            listOfHearings = listOfHearings.OrderBy(x => x.ScheduledDateTime).ToList();

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(listOfHearings);

            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationStaffMemberMultiDay)), Times.Exactly(1));
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationStaffMember)), Times.Never);
        }

        [Test]
        public async Task Should_send_reminder_email_to_all_participants_and_confirmation_email_to_judge_and_staffmember()
        {
            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                    Times.Exactly(4));
            _mocker.Mock<INotificationApiClient>()
               .Verify(
                   x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingReminderJoh)),
                   Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingReminderLip)),
                    Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingReminderRepresentative)),
                    Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationStaffMember)),
                    Times.Once);
        }

        [TestCase("Judicial Office Holder")]
        [TestCase("Litigant In Person")]
        [TestCase("Representatives")]
        public async Task Should_send_confirmation_emails_to_telephone_participants_single_day(string hearingRoleName)
        {
            var telephoneParticipant = new TelephoneParticipantResponse
            {
                HearingRoleName = hearingRoleName,
                FirstName = "firstname",
                LastName = "last Name",
                ContactEmail = "test@test.com",
                TelephoneNumber = "123456756"
            };

            _hearing.TelephoneParticipants.Add(telephoneParticipant);

            await _service.NewHearingSendConfirmation(_hearing);

            _mocker.Mock<INotificationApiClient>()
                    .Verify(
                        x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(n => n.NotificationType == NotificationType.TelephoneHearingConfirmation)),
                        Times.Exactly(_hearing.TelephoneParticipants.Count(t => t.HearingRoleName != "Judge")));
        }

        [TestCase("Judicial Office Holder")]
        [TestCase("Litigant In Person")]
        [TestCase("Representatives")]
        public async Task Should_send_confirmation_emails_to_telephone_participants_multi_day(string hearingRoleName)
        {
            var telephoneParticipant = new TelephoneParticipantResponse
            {
                HearingRoleName = hearingRoleName,
                FirstName = "firstname",
                LastName = "last Name",
                ContactEmail = "test@test.com",
                TelephoneNumber = "123456756"
            };

            _hearing.TelephoneParticipants.Add(telephoneParticipant);

            await _service.SendMultiDayHearingConfirmationEmail(_hearing, 4);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(n => n.NotificationType == NotificationType.TelephoneHearingConfirmationMultiDay)),
                    Times.Exactly(_hearing.TelephoneParticipants.Count(t => t.HearingRoleName != "Judge")));
        }

        [Test]
        public async Task Should_send_confirmation_email_to_judge_when_reminder_is_sent_to_participants()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            _hearing.OtherInformation =
                new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" }.ToOtherInformationString();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> { _hearing });
            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r =>
                        r.ParticipantId == judge.Id &&
                        r.NotificationType == NotificationType.HearingConfirmationJudge)), Times.Exactly(1));
        }

        [Test]
        public async Task
            Should_send_confirmation_email_to_judge_when_reminder_is_sent_to_participants_for_multi_day_hearing()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            _hearing.OtherInformation =
                new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" }.ToOtherInformationString();
            var hearing2 = InitHearing();
            _hearing.GroupId = _hearing.Id;
            hearing2.GroupId = _hearing.GroupId;
            _hearing.Cases[0].Name = "Day 1 of 2 Confirming a hearing";
            hearing2.Cases[0].Name = "Day 2 of 2 Confirming a hearing";
            hearing2.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1);
            var listOfHearings = new List<HearingDetailsResponse> { _hearing, hearing2 };
            listOfHearings = listOfHearings.OrderBy(x => x.ScheduledDateTime).ToList();

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(listOfHearings);

            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r =>
                        r.ParticipantId == judge.Id &&
                        r.NotificationType == NotificationType.HearingConfirmationJudgeMultiDay)), Times.Exactly(1));
        }

        [Test]
        public async Task
            Should_not_send_confirmation_email_to_judge_when_reminder_is_sent_to_participants_for_multi_day_hearing_and_is_not_the_main_hearing()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            _hearing.OtherInformation =
                new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" }.ToOtherInformationString();
            var hearing2 = InitHearing();
            _hearing.GroupId = _hearing.Id;
            hearing2.GroupId = _hearing.GroupId;
            _hearing.Cases[0].Name = "Day 1 of 2 Confirming a hearing";
            hearing2.Cases[0].Name = "Day 2 of 2 Confirming a hearing";
            hearing2.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1);
            var listOfHearings = new List<HearingDetailsResponse> { _hearing, hearing2 };
            listOfHearings = listOfHearings.OrderBy(x => x.ScheduledDateTime).ToList();

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(listOfHearings);

            await _service.SendHearingReminderEmail(hearing2);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r =>
                        r.ParticipantId == judge.Id &&
                        r.NotificationType == NotificationType.HearingConfirmationJudgeMultiDay)), Times.Never);
        }

        [Test]
        public async Task
            Should_not_send_confirmation_email_to_judge_when_reminder_is_sent_to_participants_if_no_judge_email_exists()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            _hearing.OtherInformation = new OtherInformationDetails { JudgeEmail = null }.ToOtherInformationString();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> { _hearing });
            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.ParticipantId == judge.Id)),
                    Times.Exactly(0));
        }

        [Test]
        public async Task Should_return_correct_tele_conference_id_and_phone_number()
        {
            // Act
            var teleConferenceDetails = await _service.GetTelephoneConferenceDetails(Guid.NewGuid());

            // Assert
            teleConferenceDetails.TeleConferencePhoneNumber.Should().Be(_expectedTeleConferencePhoneNumber);
            teleConferenceDetails.TeleConferenceId.Should().Be(_expectedTeleConferenceId);
        }

        [Test]
        public void Should_throw_an_invalid_operation_exception_if_the_conference_doesnt_have_a_valid_meeting_room()
        {
            // Arrange
            _mocker.Mock<IConferenceDetailsService>()
                .Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
                .ReturnsAsync(new ConferenceDetailsResponse
                {
                    MeetingRoom = null
                });

            // Act & Assert
            Assert.ThrowsAsync<InvalidOperationException>(async () => await _service.GetTelephoneConferenceDetails(Guid.NewGuid()));
        }

        [Test]
        public async Task Should_not_send_reminder_email_when_hearing_is_generic_case_type()
        {
            _hearing.Status = BookingsApi.Contract.Enums.BookingStatus.Created;
            _hearing.CaseTypeName = "Generic";
            _hearing.HearingTypeName = "Demo";

            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                  .Verify(
                  x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.JudgeDemoOrTest)),
                  Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.StaffMemberDemoOrTest)),
                Times.Once);
        }

        [Test]
        public void Should_return_false_if_HearingRoomName_is_not_changed()
        {
            _editHearingRequest.HearingRoomName = "Updated HearingRoomName";
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_HearingVenueName_is_changed()
        {
            _editHearingRequest.HearingRoomName = "Updated HearingVenueName";
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_OtherInformation_is_changed()
        {
            _editHearingRequest.OtherInformation = "Updated OtherInformation";

            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_ScheduledDuration_is_changed()
        {
            _editHearingRequest.ScheduledDuration =
                _updatedExistingParticipantHearingOriginal.ScheduledDuration + 1;
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_QuestionnaireNotRequired_is_changed()
        {
            _editHearingRequest.QuestionnaireNotRequired =
                !_updatedExistingParticipantHearingOriginal.QuestionnaireNotRequired;
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_endpoint_count_is_changed()
        {
            _editHearingRequest.Endpoints.Add(new EditEndpointRequest
            {
                Id = Guid.NewGuid(),
                DisplayName = "test",
                DefenceAdvocateUsername = Guid.NewGuid().ToString(),
            });
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_endpoint_displayName_is_changed()
        {
            _editHearingRequest.Endpoints.First().DisplayName = "test1";
            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_endpoint_removed()
        {
            _updatedExistingParticipantHearingOriginal.Endpoints.Add(new EndpointResponse
            {
                Id = Guid.NewGuid(),
                DisplayName = "test",
                DefenceAdvocateId = Guid.NewGuid(),
            });
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_endpoint_defenceAdvocateUsername_is_changed()
        {
            _updatedExistingParticipantHearingOriginal.Endpoints.First().DefenceAdvocateId = Guid.NewGuid();
            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_participant_removed()
        {
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse { Id = Guid.NewGuid() });
            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_true_when_participant_added()
        {
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });
            Assert.True(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_nothing_changed_in_participants()
        {
            var participantRequest1 = new EditParticipantRequest { Id = It.IsAny<Guid>(), DisplayName = "Test", };
            var editParticipants1 = new List<EditParticipantRequest> { participantRequest1 };
            var editParticipants2 = new List<EditParticipantRequest> { participantRequest1 };

            Assert.True(_service.GetAddedParticipant(editParticipants1, editParticipants2).Count == 0);
        }

        [Test]
        public void Should_return_false_if_participant_displayName_changed()
        {
            _editHearingRequest.Participants.First().DisplayName = "DisplayName changed";

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_participant_lastName_changed()
        {
            _editHearingRequest.Participants.First().LastName = "LastName changed";

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_throws_InvalidOperationException()
        {
            _updatedExistingParticipantHearingOriginal.Cases = new List<CaseResponse>();
            Assert.Throws<InvalidOperationException>(() => _service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_case_name_is_different()
        {
            _editHearingRequest.Case.Name = "Updated Case Name";

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_case_number_is_different()
        {
            _editHearingRequest.Case.Number = "Updated Number";
            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_ScheduledDateTime_is_different()
        {
            _editHearingRequest.ScheduledDateTime = DateTime.Now;

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public async Task Should_process_participants()
        {
            var existingParticipants = new List<UpdateParticipantRequest>();
            var newParticipants = new List<BookingsApi.Contract.Requests.ParticipantRequest>();
            var removedParticipantIds = new List<Guid>();
            var linkedParticipants = new List<LinkedParticipantRequest>();

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> { _hearing });

            await _service.ProcessParticipants(_hearing.Id, existingParticipants, newParticipants, removedParticipantIds, linkedParticipants);

            _mocker.Mock<IBookingsApiClient>()
                .Verify(
                    x => x.UpdateHearingParticipantsAsync(_hearing.Id, It.Is<UpdateHearingParticipantsRequest>(x =>
                        x.ExistingParticipants == existingParticipants
                        && x.NewParticipants == newParticipants
                        && x.RemovedParticipantIds == removedParticipantIds
                        && x.LinkedParticipants == linkedParticipants)), Times.Once);
        }

        [Test]
        public async Task Should_process_new_joh_participant()
        {
            // Arrange
            var participant = new EditParticipantRequest()
            {
                Id = Guid.NewGuid(),
                HearingRoleName = "Panel Member",
                ContactEmail = "contact@email.com"
            };
            var removedParticipantIds = new List<Guid>();
            var usernameAdIdDict = new Dictionary<string, User>();

            // Act
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing,
                usernameAdIdDict);

            // Assert
            newParticipant.Should().NotBeNull();
            newParticipant.Username.Should().Be(participant.ContactEmail);
        }

        [Test]
        public async Task Should_NOT_process_new_joh_participant_when_participant_is_in_list_and_NOT_removed()
        {
            // Arrange
            var participant = new EditParticipantRequest()
            {
                Id = Guid.NewGuid(),
                HearingRoleName = "Panel Member",
                ContactEmail = "contact@email.com"
            };

            _hearing.Participants.Add(new ParticipantResponse()
            {
                Id = participant.Id.Value,
                Username = participant.ContactEmail,
                ContactEmail = participant.ContactEmail
            });

            var removedParticipantIds = new List<Guid>();
            var usernameAdIdDict = new Dictionary<string, User>();

            // Act
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing,
                usernameAdIdDict);

            // Assert
            newParticipant.Should().BeNull();
        }

        [Test]
        public async Task NewHearingSendConfirmation_Should_NOT_Receive_Call_When_HearingType_Is_AUTOMATEDTEST()
        {
            _hearing.CaseTypeName = "Generic";
            _hearing.HearingTypeName = "Automated Test";
            await _service.NewHearingSendConfirmation(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Never);
        }

        [Test]
        public async Task NewHearingSendConfirmation_Should_Receive_Call_When_HearingType_Is_DEMO()
        {
            _hearing.CaseTypeName = "Generic";
            _hearing.HearingTypeName = "Demo";
            await _service.NewHearingSendConfirmation(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.JudgeDemoOrTest)),
                Times.Never);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.StaffMemberDemoOrTest)),
                Times.Never);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.ParticipantDemoOrTest)),
                Times.Exactly(3));
        }

        [Test]
        public async Task NewHearingSendConfirmation_Should_send_confirmation_email_when_hearing_is_generic_case_type()
        {
            _hearing.CaseTypeName = "Generic";
            _hearing.HearingTypeName = "Daily Test";

            await _service.NewHearingSendConfirmation(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.Parameters["test type"] == _hearing.HearingTypeName)), Times.Exactly(3));
        }

        [Test]
        public async Task NewHearingSendConfirmation_Should_send_confirmation_email_when_hearing_is_generic_case_type_for_confirmed_hearing()
        {
            _hearing.CaseTypeName = "Generic";
            _hearing.HearingTypeName = "Daily Test";
            _hearing.Status = BookingsApi.Contract.Enums.BookingStatus.Created;

            await _service.NewHearingSendConfirmation(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.Parameters["test type"] == _hearing.HearingTypeName)), Times.Exactly(5));
        }

        [Test]
        public async Task NewHearingSendConfirmation_Should_NOT_Receive_Call_For_JUDGE_And_STAFFMEMBER()
        {
            await _service.NewHearingSendConfirmation(_hearing);

            _mocker.Mock<INotificationApiClient>()
                         .Verify(
                             x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Exactly(4));
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationJoh)),
                    Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationLip)),
                    Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationRepresentative)),
                    Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.TelephoneHearingConfirmation)),
                    Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationJudge)),
                    Times.Never);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationStaffMember)),
                    Times.Never);
        }
        
        [Test]
        public async Task EditHearingSendConfirmation_Should_NOT_Receive_Call_For_JUDGE_UnConfirmed()
        {
            await _service.EditHearingSendConfirmation(_hearing);

            _mocker.Mock<INotificationApiClient>()
                         .Verify(
                             x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Exactly(4));
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationJoh)),
                    Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationLip)),
                    Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationRepresentative)),
                    Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.TelephoneHearingConfirmation)),
                    Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationJudge)),
                    Times.Never);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.HearingConfirmationStaffMember)),
                    Times.Never);
        }

        [Test]
        public async Task EditHearingSendConfirmation_Should_Receive_Call_When_HearingType_Is_DEMO()
        {
            _hearing.CaseTypeName = "Generic";
            _hearing.HearingTypeName = "Demo";
            await _service.EditHearingSendConfirmation(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.JudgeDemoOrTest)),
                Times.Never);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.StaffMemberDemoOrTest)),
                Times.Never);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.ParticipantDemoOrTest)),
                Times.Exactly(3));
        }
        
        [Test]
        public async Task EditHearingSendConfirmation_Should_Receive_Call_When_HearingType_Is_DEMO_for_Confirmedhearing()
        {
            _hearing.CaseTypeName = "Generic";
            _hearing.HearingTypeName = "Demo";
            _hearing.Status = BookingsApi.Contract.Enums.BookingStatus.Created;
            await _service.EditHearingSendConfirmation(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.JudgeDemoOrTest)),
                Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.StaffMemberDemoOrTest)),
                Times.Once);
            _mocker.Mock<INotificationApiClient>()
                .Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.NotificationType == NotificationType.ParticipantDemoOrTest)),
                Times.Exactly(3));
        }

        [Test]
        public async Task EditHearingSendConfirmation_Should_NOT_Receive_Call_When_HearingType_Is_AUTOMATEDTEST()
        {
            _hearing.CaseTypeName = "Generic";
            _hearing.HearingTypeName = "Automated Test";
            await _service.EditHearingSendConfirmation(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Never);
        }

        [Test]
        public async Task EditHearingSendConfirmation_Should_NOT_Receive_StaffMember_Notification_For_UnConfirmed_Hearing()
        {
            await _service.EditHearingSendConfirmation(_hearing);

            _mocker.Mock<INotificationApiClient>()
               .Verify(x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(n => n.NotificationType == NotificationType.HearingConfirmationStaffMember)), Times.Never);
        }
        
        [Test]
        public async Task EditHearingSendConfirmation_Should_Receive_StaffMember_Notification_For_Confirmed_Hearing()
        {
            _hearing.Status = BookingsApi.Contract.Enums.BookingStatus.Created;
            await _service.EditHearingSendConfirmation(_hearing);

            _mocker.Mock<INotificationApiClient>()
               .Verify(x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(n => n.NotificationType == NotificationType.HearingConfirmationStaffMember)), Times.Once);
        }


        [Test]
        public async Task Should_process_new_joh_participant_when_participant_is_in_list_and_is_removed()
        {
            // Arrange
            var participant = new EditParticipantRequest()
            {
                Id = Guid.NewGuid(),
                CaseRoleName = "Judge",
                ContactEmail = "contact@email.com"
            };

            _hearing.Participants.Add(new ParticipantResponse()
            {
                Id = participant.Id.Value,
                Username = participant.ContactEmail,
                ContactEmail = participant.ContactEmail
            });

            var removedParticipantIds = new List<Guid>
            {
                participant.Id.Value
            };

            var usernameAdIdDict = new Dictionary<string, User>();

            // Act
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing,
                usernameAdIdDict);

            // Assert
            newParticipant.Should().NotBeNull();
            newParticipant.Username.Should().Be(participant.ContactEmail);
        }

        [Test]
        public async Task Should_process_non_joh_participant()
        {
            // Arrange
            var participant = new EditParticipantRequest()
            {
                Id = Guid.NewGuid(),
                CaseRoleName = "NOT JUDGE",
                ContactEmail = "contact@email.com"
            };

            var removedParticipantIds = new List<Guid>();
            var usernameAdIdDict = new Dictionary<string, User>();
            var password = "password";
            var user = new User()
            {
                UserName = participant.ContactEmail,
                Password = password
            };

            _mocker.Mock<IUserAccountService>().Setup(x =>
                    x.UpdateParticipantUsername(It.Is<BookingsApi.Contract.Requests.ParticipantRequest>(y => y.ContactEmail == participant.ContactEmail)))
                .ReturnsAsync(user);

            // Act
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing,
                usernameAdIdDict);

            // Assert
            newParticipant.Should().NotBeNull();
            newParticipant.Username.Should().Be(participant.ContactEmail);
            usernameAdIdDict.Should().ContainKey(participant.ContactEmail);
            usernameAdIdDict[participant.ContactEmail].Should().BeEquivalentTo(user);
        }

        private HearingDetailsResponse InitHearing()
        {
            var cases = new List<CaseResponse> { new CaseResponse { Name = "Test", Number = "123456" } };
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
            var staffMember = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Staff Member")
                .Build();
            var telephoneParticipant = Builder<TelephoneParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .Build();

            return Builder<HearingDetailsResponse>.CreateNew()
                .With(h => h.Participants = new List<ParticipantResponse> { rep, ind, joh, judge, staffMember })
                .With(h => h.TelephoneParticipants = new List<TelephoneParticipantResponse> { telephoneParticipant })
                .With(x => x.Cases = cases)
                .With(x => x.Id = Guid.NewGuid())
                .Build();
        }
    }
}