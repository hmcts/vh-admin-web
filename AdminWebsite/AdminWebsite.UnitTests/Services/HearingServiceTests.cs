using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Extensions;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Services;
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
        private EditHearingRequest _addNewParticipantRequest;

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
            
            _service = _mocker.Create<HearingsService>();
            _hearing = InitHearing();
            _validId = Guid.NewGuid();

            var cases = new List<CaseResponse> {new CaseResponse {Name = "Case", Number = "123"}};

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
                Cases = cases,
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

            _addNewParticipantRequest = new EditHearingRequest
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
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Never);
        }

        [Test]
        public async Task should_send_amendment_email_to_all_participants_except_a_judge_if_no_email_exists()
        {
            _hearing.OtherInformation = JsonConvert.SerializeObject(new OtherInformationDetails {JudgeEmail = null});

            var secondHearing = InitHearing();
            secondHearing.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1).AddHours(3).AddMinutes(20);
            await _service.SendHearingUpdateEmail(_hearing, secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
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
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
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
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                    Times.Exactly(secondHearing.Participants.Count - 1));

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r =>
                        r.NotificationType == NotificationType.HearingConfirmationJudgeMultiDay)), Times.Never);
        }

        [Test]
        public async Task should_send_confirmation_email_to_new_judge_when_amending_judge_email()
        {
            var secondHearing = InitHearing();
            secondHearing.OtherInformation =
                new OtherInformationDetails {JudgeEmail = "judge@hmcts.net"}.ToOtherInformationString();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> {_hearing});

            await _service.SendJudgeConfirmationEmail(secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Exactly(1));
        }

        [Test]
        public async Task should_not_send_confirmation_email_when_hearing_is_not_the_first_hearing_of_a_mdh()
        {
            var secondHearing = InitHearing();
            _hearing.GroupId = secondHearing.GroupId = _hearing.Id;
            secondHearing.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1).AddHours(3).AddMinutes(20);

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> {_hearing, secondHearing});

            await _service.SendJudgeConfirmationEmail(secondHearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Never);
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
                .Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Never);
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
            _hearing.OtherInformation =
                new OtherInformationDetails {JudgeEmail = "judge@hmcts.net"}.ToOtherInformationString();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> {_hearing});
            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r =>
                        r.ParticipantId == judge.Id &&
                        r.NotificationType == NotificationType.HearingConfirmationJudge)), Times.Exactly(1));
        }

        [Test]
        public async Task
            should_send_confirmation_email_to_judge_when_reminder_is_sent_to_participants_for_multi_day_hearing()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            _hearing.OtherInformation =
                new OtherInformationDetails {JudgeEmail = "judge@hmcts.net"}.ToOtherInformationString();
            var hearing2 = InitHearing();
            _hearing.GroupId = _hearing.Id;
            hearing2.GroupId = _hearing.GroupId;
            _hearing.Cases[0].Name = "Day 1 of 2 Confirming a hearing";
            hearing2.Cases[0].Name = "Day 2 of 2 Confirming a hearing";
            hearing2.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1);
            var listOfHearings = new List<HearingDetailsResponse> {_hearing, hearing2};
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
            should_not_send_confirmation_email_to_judge_when_reminder_is_sent_to_participants_for_multi_day_hearing_and_is_not_the_main_hearing()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            _hearing.OtherInformation =
                new OtherInformationDetails {JudgeEmail = "judge@hmcts.net"}.ToOtherInformationString();
            var hearing2 = InitHearing();
            _hearing.GroupId = _hearing.Id;
            hearing2.GroupId = _hearing.GroupId;
            _hearing.Cases[0].Name = "Day 1 of 2 Confirming a hearing";
            hearing2.Cases[0].Name = "Day 2 of 2 Confirming a hearing";
            hearing2.ScheduledDateTime = _hearing.ScheduledDateTime.AddDays(1);
            var listOfHearings = new List<HearingDetailsResponse> {_hearing, hearing2};
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
            should_not_send_confirmation_email_to_judge_when_reminder_is_sent_to_participants_if_no_judge_email_exists()
        {
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            _hearing.OtherInformation = new OtherInformationDetails {JudgeEmail = null}.ToOtherInformationString();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> {_hearing});
            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.ParticipantId == judge.Id)),
                    Times.Exactly(0));
        }

        [Test]
        public async Task should_return_correct_tele_conference_id_and_phone_number()
        {
            // Act
            var teleConferenceDetails = await _service.GetTelephoneConferenceDetails(Guid.NewGuid());
            
            // Assert
            teleConferenceDetails.TeleConferencePhoneNumber.Should().Be(_expectedTeleConferencePhoneNumber);
            teleConferenceDetails.TeleConferenceId.Should().Be(_expectedTeleConferenceId);
        }
        
        [Test]
        public void should_throw_an_invalid_operation_exception_if_the_conference_doesnt_have_a_valid_meeting_room()
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
        public async Task should_not_send_reminder_email_when_hearing_is_generic_case_type()
        {
            var expectedConferencePhoneNumber = "phone_number";
            var judge = _hearing.Participants.First(x => x.UserRoleName == "Judge");
            _hearing.CaseTypeName = "Generic";
            await _service.SendHearingReminderEmail(_hearing);

            _mocker.Mock<INotificationApiClient>()
                .Verify(
                    x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r => r.ParticipantId != judge.Id && r.Parameters["conference phone number"] == expectedConferencePhoneNumber)),
                    Times.Never);
        }

        [Test]
        public async Task Should_save_updated_panel_menber_details()
        {
            //Arrange 
            var participantId = _hearing.Participants[0].Id;
            var updatedParticipant = new EditParticipantRequest
            {
                DisplayName = "New Display Name", Id = participantId, TelephoneNumber = "12345", Title = "New Title"
            };

            //Act
            await _service.ProcessExistingParticipants(_hearing.Id, _hearing, updatedParticipant);

            //Assert
            _mocker.Mock<IBookingsApiClient>()
                .Verify(
                    x => x.UpdateParticipantDetailsAsync(It.Is<Guid>(h => h == _hearing.Id),
                        It.Is<Guid>(p => p == participantId),
                        It.Is<UpdateParticipantRequest>(r =>
                            r.DisplayName == updatedParticipant.DisplayName &&
                            r.TelephoneNumber == updatedParticipant.TelephoneNumber &&
                            r.Title == updatedParticipant.Title)), Times.Once);
        }

        [Test]
        public void Should_return_false_if_HearingRoomName_is_not_changed()
        {
            _addNewParticipantRequest.HearingRoomName = "Updated HearingRoomName";
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest {Id = Guid.NewGuid()});

            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_HearingVenueName_is_changed()
        {
            _addNewParticipantRequest.HearingRoomName = "Updated HearingVenueName";
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest {Id = Guid.NewGuid()});

            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_OtherInformation_is_changed()
        {
            _addNewParticipantRequest.OtherInformation = "Updated OtherInformation";

            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest {Id = Guid.NewGuid()});

            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_ScheduledDuration_is_changed()
        {
            _addNewParticipantRequest.ScheduledDuration =
                _updatedExistingParticipantHearingOriginal.ScheduledDuration + 1;
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest {Id = Guid.NewGuid()});

            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_QuestionnaireNotRequired_is_changed()
        {
            _addNewParticipantRequest.QuestionnaireNotRequired =
                !_updatedExistingParticipantHearingOriginal.QuestionnaireNotRequired;
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest {Id = Guid.NewGuid()});

            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_endpoint_count_is_changed()
        {
            _addNewParticipantRequest.Endpoints.Add(new EditEndpointRequest
            {
                Id = Guid.NewGuid(), DisplayName = "test", DefenceAdvocateUsername = Guid.NewGuid().ToString(),
            });
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest {Id = Guid.NewGuid()});

            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_endpoint_displayName_is_changed()
        {
            _addNewParticipantRequest.Endpoints.First().DisplayName = "test1";
            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_endpoint_removed()
        {
            _updatedExistingParticipantHearingOriginal.Endpoints.Add(new EndpointResponse
            {
                Id = Guid.NewGuid(), DisplayName = "test", DefenceAdvocateId = Guid.NewGuid(),
            });
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest {Id = Guid.NewGuid()});

            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_endpoint_defenceAdvocateUsername_is_changed()
        {
            _updatedExistingParticipantHearingOriginal.Endpoints.First().DefenceAdvocateId = Guid.NewGuid();
            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_participant_removed()
        {
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse {Id = Guid.NewGuid()});
            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_true_when_participant_added()
        {
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest {Id = Guid.NewGuid()});
            Assert.True(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_nothing_changed_in_participants()
        {
            var participantRequest1 = new EditParticipantRequest {Id = It.IsAny<Guid>(), DisplayName = "Test",};
            var editParticipants1 = new List<EditParticipantRequest> {participantRequest1};
            var editParticipants2 = new List<EditParticipantRequest> {participantRequest1};

            Assert.False(_service.HasParticipantsOnlyBeenAdded(editParticipants1, editParticipants2));
        }

        [Test]
        public void Should_return_false_if_participant_displayName_changed()
        {
            _addNewParticipantRequest.Participants.First().DisplayName = "DisplayName changed";

            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_participant_lastName_changed()
        {
            _addNewParticipantRequest.Participants.First().LastName = "LastName changed";

            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_throws_InvalidOperationException()
        {
            _updatedExistingParticipantHearingOriginal.Cases = new List<CaseResponse>();
            Assert.Throws<InvalidOperationException>(() => _service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_AudioRecordingRequired_changed()
        {
            _addNewParticipantRequest.AudioRecordingRequired =
                !_updatedExistingParticipantHearingOriginal.AudioRecordingRequired;
            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_case_name_is_different()
        {
            _addNewParticipantRequest.Case.Name = "Updated Case Name";

            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_case_number_is_different()
        {
            _addNewParticipantRequest.Case.Number = "Updated Number";
            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_ScheduledDateTime_is_different()
        {
            _addNewParticipantRequest.ScheduledDateTime = DateTime.Now;

            Assert.False(_service.IsAddingParticipantOnly(_addNewParticipantRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        private HearingDetailsResponse InitHearing()
        {
            var cases = new List<CaseResponse> {new CaseResponse {Name = "Test", Number = "123456"}};
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
            return Builder<HearingDetailsResponse>.CreateNew()
                .With(h => h.Participants = new List<ParticipantResponse> {rep, ind, joh, judge})
                .With(x => x.Cases = cases)
                .With(x => x.Id = Guid.NewGuid())
                .Build();
        }
    }
}