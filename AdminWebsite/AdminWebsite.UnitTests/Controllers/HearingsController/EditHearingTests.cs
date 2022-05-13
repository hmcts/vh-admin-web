using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Castle.Core.Internal;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Extensions;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.Services.Models;
using AdminWebsite.UnitTests.Helper;
using BookingsApi.Client;
using BookingsApi.Contract.Configuration;
using BookingsApi.Contract.Enums;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
using NotificationApi.Client;
using NotificationApi.Contract;
using NotificationApi.Contract.Requests;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using CaseResponse = BookingsApi.Contract.Responses.CaseResponse;
using EndpointResponse = BookingsApi.Contract.Responses.EndpointResponse;
using LinkedParticipantResponse = BookingsApi.Contract.Responses.LinkedParticipantResponse;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class EditHearingTests
    {
        private EditHearingRequest _addEndpointToHearingRequest;
        private EditHearingRequest _addNewParticipantRequest;
        private Mock<IBookingsApiClient> _bookingsApiClient;

        private AdminWebsite.Controllers.HearingsController _controller;
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private HearingDetailsResponse _existingHearingWithEndpointsOriginal;
        private HearingDetailsResponse _existingHearingWithLinkedParticipants;
        private IHearingsService _hearingsService;
        private Mock<INotificationApiClient> _notificationApiMock;

        private Mock<ILogger<HearingsService>> _participantGroupLogger;
        private Mock<IPollyRetryService> _pollyRetryServiceMock;
        private HearingDetailsResponse _updatedExistingParticipantHearingOriginal;
        private Mock<IUserAccountService> _userAccountService;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IConferenceDetailsService> _conferencesServiceMock;
        private Mock<IOptions<KinlyConfiguration>> _kinlyOptionsMock;
        private Mock<KinlyConfiguration> _kinlyConfigurationMock;

        private Guid _validId;
        private Mock<IVideoApiClient> _videoApiMock;
        private Mock<IFeatureToggles> _featureToggle;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountService = new Mock<IUserAccountService>();
            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();
            _videoApiMock = new Mock<IVideoApiClient>();
            _notificationApiMock = new Mock<INotificationApiClient>();
            _pollyRetryServiceMock = new Mock<IPollyRetryService>();
            _conferencesServiceMock = new Mock<IConferenceDetailsService>();
            _featureToggle = new Mock<IFeatureToggles>();
            _featureToggle.Setup(e => e.BookAndConfirmToggle()).Returns(true);
            _conferencesServiceMock.Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
                .ReturnsAsync(new ConferenceDetailsResponse
                {
                    MeetingRoom = new MeetingRoomResponse
                    {
                        AdminUri = "AdminUri",
                        JudgeUri = "JudgeUri",
                        ParticipantUri = "ParticipantUri",
                        PexipNode = "PexipNode",
                        PexipSelfTestNode = "PexipSelfTestNode",
                        TelephoneConferenceId = "expected_conference_phone_id"
                    }
                });

            _kinlyOptionsMock = new Mock<IOptions<KinlyConfiguration>>();
            _kinlyConfigurationMock = new Mock<KinlyConfiguration>();
            _kinlyOptionsMock.Setup((op) => op.Value).Returns(_kinlyConfigurationMock.Object);

            _participantGroupLogger = new Mock<ILogger<HearingsService>>();
            _hearingsService = new HearingsService(_pollyRetryServiceMock.Object,
            _userAccountService.Object, _notificationApiMock.Object, _videoApiMock.Object,
            _bookingsApiClient.Object, _participantGroupLogger.Object, _conferencesServiceMock.Object, 
            _kinlyOptionsMock.Object, _featureToggle.Object);

            _bookingsApiClient.Setup(x => x.GetFeatureFlagAsync(It.Is<string>(f => f == nameof(FeatureFlags.EJudFeature)))).ReturnsAsync(true);

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService.Object,
                _editHearingRequestValidator.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _hearingsService,
                _conferencesServiceMock.Object,
                _featureToggle.Object);

            _validId = Guid.NewGuid();
            _addNewParticipantRequest = new EditHearingRequest
            {
                Case = new EditCaseRequest
                {
                    Name = "Case",
                    Number = "123"
                },
                Participants = new List<EditParticipantRequest>
                {
                    new EditParticipantRequest
                    {
                        ContactEmail = "new@hmcts.net",
                        FirstName = "Test_FirstName",
                        LastName = "Test_LastName"
                    }
                },
            };

            var cases = new List<CaseResponse>
            {
                new CaseResponse {Name = "Case", Number = "123"}
            };

            _updatedExistingParticipantHearingOriginal = new HearingDetailsResponse
            {
                Id = _validId,
                GroupId = _validId,
                Participants = new List<ParticipantResponse>
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
                OtherInformation = ""
            };

            var participant1 = Guid.NewGuid();
            var participant2 = Guid.NewGuid();
            var participant3 = Guid.NewGuid();
            _existingHearingWithLinkedParticipants = new HearingDetailsResponse
            {
                Id = _validId,
                GroupId = _validId,
                Cases = cases,
                CaseTypeName = "case type",
                HearingTypeName = "hearing type",
                Participants = new List<ParticipantResponse>
                {
                    new ParticipantResponse
                    {
                        Id = participant1, CaseRoleName = "judge", HearingRoleName = "hearingrole",
                        ContactEmail = "judge.user@email.com", UserRoleName = "Judge", FirstName = "Judge",
                        LinkedParticipants = new List<LinkedParticipantResponse>()
                    },
                    new ParticipantResponse
                    {
                        Id = participant2, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual.user@email.com", UserRoleName = "Individual",
                        FirstName = "testuser1",
                        LinkedParticipants = new List<LinkedParticipantResponse>
                        {
                            new LinkedParticipantResponse
                                {Type = LinkedParticipantType.Interpreter, LinkedId = participant3}
                        }
                    },
                    new ParticipantResponse
                    {
                        Id = participant3, CaseRoleName = "caserole", HearingRoleName = "interpreter",
                        ContactEmail = "interpreter.user@email.com", UserRoleName = "Individual",
                        FirstName = "testuser1",
                        LinkedParticipants = new List<LinkedParticipantResponse>
                        {
                            new LinkedParticipantResponse
                                {Type = LinkedParticipantType.Interpreter, LinkedId = participant2}
                        }
                    }
                },
                ScheduledDateTime = DateTime.UtcNow.AddHours(3),
                OtherInformation = ""
            };

            var guid1 = Guid.NewGuid();
            var guid2 = Guid.NewGuid();
            var guid3 = Guid.NewGuid();
            var guid4 = Guid.NewGuid();
            _addEndpointToHearingRequest = new EditHearingRequest
            {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                Participants = new List<EditParticipantRequest>(),
                Endpoints = new List<EditEndpointRequest>
                {
                    new EditEndpointRequest
                        {Id = null, DisplayName = "New Endpoint", DefenceAdvocateUsername = "username@hmcts.net"},
                    new EditEndpointRequest
                        {Id = guid1, DisplayName = "data1", DefenceAdvocateUsername = "edit-user@hmcts.net"},
                    new EditEndpointRequest {Id = guid2, DisplayName = "data2-edit"},
                    new EditEndpointRequest {Id = guid4, DisplayName = "data4-edit", DefenceAdvocateUsername = ""}
                }
            };

            _existingHearingWithEndpointsOriginal = new HearingDetailsResponse
            {
                Id = _validId,
                Participants = new List<ParticipantResponse>(),
                Endpoints = new List<EndpointResponse>
                {
                    new EndpointResponse {DisplayName = "data1", Id = guid1, Pin = "0000", Sip = "1111111111"},
                    new EndpointResponse
                    {
                        DisplayName = "data2", Id = guid2, Pin = "1111", Sip = "2222222222",
                        DefenceAdvocateId = Guid.NewGuid()
                    },
                    new EndpointResponse {DisplayName = "data3", Id = guid3, Pin = "2222", Sip = "5544332234"},
                    new EndpointResponse
                    {
                        DisplayName = "data4", Id = guid4, Pin = "2222", Sip = "5544332234",
                        DefenceAdvocateId = Guid.NewGuid()
                    }
                },
                Cases = cases,
                CaseTypeName = "Unit Test",
                ScheduledDateTime = DateTime.UtcNow.AddHours(3)
            };

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal);

            _editHearingRequestValidator.Setup(x => x.Validate(It.IsAny<EditHearingRequest>()))
                .Returns(new ValidationResult());
            _userAccountService
                .Setup(x => x.UpdateParticipantUsername(It.IsAny<BookingsApi.Contract.Requests.ParticipantRequest>()))
                .ReturnsAsync((BookingsApi.Contract.Requests.ParticipantRequest participant) => new User()
                {
                    UserName = participant.ContactEmail,
                    Password = "password"
                });
        }

        [Test]
        public async Task Should_return_bad_request_if_invalid_hearing_id()
        {
            var invalidId = Guid.Empty;
            var result = await _controller.EditHearing(invalidId, _addNewParticipantRequest);
            var badRequestResult = (BadRequestObjectResult)result.Result;
            var errors = (SerializableError)badRequestResult.Value;
            errors["hearingId"].Should().BeEquivalentTo(new[] { "Please provide a valid hearingId" });
        }

        [Test]
        public async Task Should_return_bad_request_if_case_is_not_given()
        {
            _editHearingRequestValidator.Setup(x => x.Validate(It.IsAny<EditHearingRequest>()))
                .Returns(new ValidationResult(new[]
                {
                    new ValidationFailure("case", "Please provide valid case details", new object())
                }));

            _addNewParticipantRequest.Case = null;

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var badRequestResult = (BadRequestObjectResult)result.Result;
            var errors = (SerializableError)badRequestResult.Value;
            errors["case"].Should().BeEquivalentTo(new[] { "Please provide valid case details" });
        }

        [Test]
        public async Task Should_return_bad_request_if_no_participants_are_given()
        {
            _editHearingRequestValidator.Setup(x => x.Validate(It.IsAny<EditHearingRequest>()))
                .Returns(new ValidationResult(new[]
                {
                    new ValidationFailure("participants", "Please provide at least one participant", new object())
                }));

            _addNewParticipantRequest.Participants.Clear();
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var badRequestResult = (BadRequestObjectResult)result.Result;
            var errors = (SerializableError)badRequestResult.Value;
            errors["participants"].Should().BeEquivalentTo(new[] { "Please provide at least one participant" });
        }

        [Test]
        public async Task
            Should_return_bad_request_if_edit_confirmed_hearing_except_only_adding_participant_prior_30_minutes_of_it_starting()
        {
            _updatedExistingParticipantHearingOriginal.ScheduledDateTime = DateTime.UtcNow.AddHours(-1);
            _updatedExistingParticipantHearingOriginal.Status = BookingStatus.Created;
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal);
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var badRequestResult = (BadRequestObjectResult)result.Result;
            var errors = (SerializableError)badRequestResult.Value;
            errors["hearingId"]
                .Should()
                .BeEquivalentTo(new[]
                {
                    $"You can't edit a confirmed hearing [{_updatedExistingParticipantHearingOriginal.Id}] within 30 minutes of it starting"
                });
        }

        [Test]
        public async Task
            Should_allow_edit_confirmed_hearing_up_until_30_minutes_before_starting()
        {
            _updatedExistingParticipantHearingOriginal.ScheduledDateTime = DateTime.UtcNow.AddHours(1);
            _addNewParticipantRequest.ScheduledDateTime = _updatedExistingParticipantHearingOriginal.ScheduledDateTime;
            _updatedExistingParticipantHearingOriginal.Status = BookingStatus.Booked;
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal);

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);

            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(
                x => x.UpdateHearingParticipantsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingParticipantsRequest>()),
                Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        !u.Cases.IsNullOrEmpty() && u.QuestionnaireNotRequired == false)),
                Times.Once);
        }

        [Test]
        public async Task Should_allow_only_participant_changes_if_hearing_starts_in_less_than_thirty_minutes()
        {
            _updatedExistingParticipantHearingOriginal.ScheduledDateTime = DateTime.UtcNow.AddHours(-1);
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
                Participants = _updatedExistingParticipantHearingOriginal.Participants.Select(EditParticipantRequestMapper.MapFrom).ToList()
            };

            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest
            {
                ContactEmail = "new2@hmcts.net",
                FirstName = "Test2_FirstName",
                LastName = "Test2_LastName"
            });
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal);

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);

            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(
                x => x.UpdateHearingParticipantsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingParticipantsRequest>()),
                Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        !u.Cases.IsNullOrEmpty() && u.QuestionnaireNotRequired == false)),
                Times.Once);
        }

        [Test]
        public async Task Should_return_not_found_if_hearing_is_missing()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var notFoundResult = (NotFoundObjectResult)result.Result;
            notFoundResult.Value.Should().Be($"No hearing with id found [{_validId}]");
        }

        [Test]
        public void Should_throw_if_hearing_exception_is_not_of_type_not_found()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));

            Assert.ThrowsAsync<BookingsApiException>(async () => await _controller.EditHearing(_validId, _addNewParticipantRequest));
        }


        [Test]
        public async Task Should_return_bad_request_if_editing_hearing_fails_with_bad_request_status_code()
        {
            //Arrange
            _addNewParticipantRequest.Participants = new List<EditParticipantRequest>();

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithLinkedParticipants);
            _bookingsApiClient.Setup(x => x.UpdateHearingParticipantsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingParticipantsRequest>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            //Act
            var response = await _controller.EditHearing(_validId, _addNewParticipantRequest);

            //Assert
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public void Should_throw_if_editing_hearing_fails_with_non_bad_request()
        {

            if (true)
            {
                //execute
            }

            if (false)
            {
                //execute
            }

            //Arrange
            _addNewParticipantRequest.Participants = new List<EditParticipantRequest>();

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithLinkedParticipants);
            _bookingsApiClient.Setup(x => x.UpdateHearingParticipantsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingParticipantsRequest>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));

            //Act/Assert
            Assert.ThrowsAsync<BookingsApiException>(async () => await _controller.EditHearing(_validId, _addNewParticipantRequest));
        }

        [TestCase("Confirmed By")]
        [TestCase("")]
        public async Task Should_add_panel_members_for_a_hearing(string confirmedBy)
        {
            //Arrange
            var updatedHearing = new HearingDetailsResponse
            {
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                CaseTypeName = "Unit Test",
                ConfirmedBy = confirmedBy
            };

            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest
            {
                HearingRoleName = RoleNames.PanelMember,
                ContactEmail = "new.contactactemail@hmcts.net",
                DisplayName = "new.displayName@hmcts.net",
                CaseRoleName = RoleNames.PanelMember
            });

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);

            var userName = _addNewParticipantRequest.Participants.Last().ContactEmail;
            _userAccountService
               .Setup(x => x.UpdateParticipantUsername(It.IsAny<BookingsApi.Contract.Requests.ParticipantRequest>()))
               .Callback<BookingsApi.Contract.Requests.ParticipantRequest>(p => p.Username = userName)
               .ReturnsAsync(new User { UserId = Guid.NewGuid().ToString(), UserName = userName, Password = "test123" });

            //Act
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);

            //Assert
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingRequest>()));
        }

        [Test]
        public async Task Should_send_email_for_new_individual_participant_added()
        {
            var userName = "old@hmcts.net";
            var updatedHearing = _updatedExistingParticipantHearingOriginal = new HearingDetailsResponse
            {
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                CaseTypeName = "Unit Test",
                ScheduledDateTime = DateTime.UtcNow.AddHours(3)
            };
            updatedHearing.Participants[0].FirstName = "New user firstname";
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                ContactEmail = "new@hmcts.net",
                Username = "new@hmcts.net",
                TelephoneNumber = "030434545",
                UserRoleName = "Individual"
            });
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);

            _userAccountService
                .Setup(x => x.UpdateParticipantUsername(It.IsAny<BookingsApi.Contract.Requests.ParticipantRequest>()))
                .Callback<BookingsApi.Contract.Requests.ParticipantRequest>(p => p.Username = userName)
                .ReturnsAsync(new User { UserId = Guid.NewGuid().ToString(), UserName = userName, Password = "test123" });

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);

            var participant = updatedHearing.Participants[0];
            _notificationApiMock.Verify(x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r =>
                r.MessageType == MessageType.Email &&
                r.NotificationType == NotificationType.CreateIndividual &&
                r.ContactEmail == participant.ContactEmail &&
                r.PhoneNumber == participant.TelephoneNumber &&
                r.Parameters.ContainsKey("name") &&
                r.Parameters["name"] == $"{participant.FirstName} {participant.LastName}" &&
                r.Parameters.ContainsKey("username") && r.Parameters["username"] == participant.Username &&
                r.Parameters.ContainsKey("random password") && r.Parameters["random password"] == "test123"
            )), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        !u.Cases.IsNullOrEmpty() && u.QuestionnaireNotRequired == false)),
                Times.Once);
        }

        [Test]
        public async Task Should_send_email_with_only_matching_participant()
        {
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest
            {
                ContactEmail = "new2@hmcts.net",
                FirstName = "Test2_FirstName",
                LastName = "Test2_LastName"
            });
            var userName = "old@hmcts.net";
            var updatedHearing = _updatedExistingParticipantHearingOriginal = new HearingDetailsResponse
            {
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                CaseTypeName = "Unit Test",
                ScheduledDateTime = _updatedExistingParticipantHearingOriginal.ScheduledDateTime
            };
            updatedHearing.Participants[0].FirstName = "New user firstname";
            updatedHearing.Participants[0].Username = "old1@hmcts.net";
            var newParticipant = new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                ContactEmail = "new@hmcts.net",
                Username = "new@hmcts.net",
                TelephoneNumber = "030434545",
                UserRoleName = "Individual"
            };
            updatedHearing.Participants.Add(newParticipant);

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);

            _userAccountService
                .Setup(x => x.UpdateParticipantUsername(
                    It.Is<BookingsApi.Contract.Requests.ParticipantRequest>(r => r.ContactEmail == "new@hmcts.net")))
                .Callback<BookingsApi.Contract.Requests.ParticipantRequest>(p => p.Username = userName)
                .ReturnsAsync(new User { UserId = Guid.NewGuid().ToString(), UserName = userName, Password = "test123" });

            _userAccountService
                .Setup(x => x.UpdateParticipantUsername(
                    It.Is<BookingsApi.Contract.Requests.ParticipantRequest>(r => r.ContactEmail == "new2@hmcts.net")))
                .Callback<BookingsApi.Contract.Requests.ParticipantRequest>(p => p.Username = "old1@hmcts.net")
                .ReturnsAsync(new User { UserId = Guid.NewGuid().ToString(), UserName = "old1@hmcts.net", Password = "test123" });

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);

            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r =>
                    r.NotificationType == NotificationType.CreateIndividual)),
                Times.Once);

            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r =>
                    r.NotificationType == NotificationType.HearingAmendmentJoh)),
                Times.Never);
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r =>
                    r.NotificationType == NotificationType.HearingAmendmentJudge)),
                Times.Never);
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r =>
                    r.NotificationType == NotificationType.HearingAmendmentLip)),
                Times.Never);
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r =>
                    r.NotificationType == NotificationType.HearingAmendmentRepresentative)),
                Times.Never);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        !u.Cases.IsNullOrEmpty() && u.QuestionnaireNotRequired == false)),
                Times.Once);
            _pollyRetryServiceMock.Verify(x => x.WaitAndRetryAsync<Exception, Task>
            (
                It.IsAny<int>(), It.IsAny<Func<int, TimeSpan>>(), It.IsAny<Action<int>>(),
                It.IsAny<Func<Task, bool>>(), It.IsAny<Func<Task<Task>>>()
            ), Times.Never);
        }

        [Test]
        public async Task Should_not_send_email_for_existing_individual_participant_added()
        {
            // Existing User
            var newParticipantId = Guid.NewGuid();
            _addNewParticipantRequest.Participants[0].Id = newParticipantId;

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(
                    It.Is<AddNotificationRequest>(r => r.ParticipantId == newParticipantId)), Times.Never);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        !u.Cases.IsNullOrEmpty() && u.QuestionnaireNotRequired == false)),
                Times.Once);
        }

        [Test]
        public async Task Should_return_updated_hearing()
        {
            var updatedHearing = new HearingDetailsResponse
            {
                Id = _validId,
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                CaseTypeName = "Unit Test"
            };
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                ContactEmail = "new@hmcts.net",
                Username = "new@hmcts.net",
                UserRoleName = "Individual"
            });

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var hearing = (HearingDetailsResponse)((OkObjectResult)result.Result).Value;
            hearing.Id.Should().Be(_updatedExistingParticipantHearingOriginal.Id);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        !u.Cases.IsNullOrEmpty() && u.QuestionnaireNotRequired == false)),
                Times.Once);
        }

        [Test]
        public async Task Should_pass_on_bad_request_from_bookings_api()
        {
            GivenApiThrowsExceptionOnUpdate(HttpStatusCode.BadRequest);

            var response = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public async Task Should_pass_on_not_found_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));

            var response = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            response.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Test]
        public async Task Should_replace_judge_based_on_email()
        {
            var existingJudgeId = Guid.NewGuid();
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse
            {
                FirstName = "Existing",
                LastName = "Judge",
                ContactEmail = "existing@hmcts.net",
                Username = "existing@hmcts.net",
                CaseRoleName = "Judge",
                UserRoleName = "Judge",
                HearingRoleName = "Judge",
                Id = existingJudgeId
            });

            const string newJudgeEmail = "new@hmcts.net";
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest
            {
                CaseRoleName = "Judge",
                HearingRoleName = "Judge",
                FirstName = "New",
                LastName = "Judge",
                ContactEmail = newJudgeEmail
            });

            var newPats = _updatedExistingParticipantHearingOriginal.Participants.Where(x => x.Id != existingJudgeId)
                .ToList();
            newPats.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                ContactEmail = "new@hmcts.net",
                Username = "new@hmcts.net",
                UserRoleName = "Individual"
            });
            newPats.Add(new ParticipantResponse
            {
                FirstName = "New",
                LastName = "Judge",
                ContactEmail = newJudgeEmail,
                Username = newJudgeEmail,
                UserRoleName = "Judge",
                CaseRoleName = "Judge",
                HearingRoleName = "Judge",
            });
            var updatedHearing = new HearingDetailsResponse
            {
                Participants = newPats,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                CaseTypeName = "Unit Test"
            };

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);

            var response = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            response.Result.Should().BeOfType<OkObjectResult>();

            _bookingsApiClient.Verify(x => x.UpdateHearingParticipantsAsync(_validId,
                It.Is<UpdateHearingParticipantsRequest>(
                    participants => participants.NewParticipants.Any(p => p.Username == newJudgeEmail))), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        !u.Cases.IsNullOrEmpty() && u.QuestionnaireNotRequired == false)),
                Times.Once);
        }

        [Test]
        public async Task Should_add_endpoint_if_new_endpoint_is_added_to_endpoint_list()
        {
            _addEndpointToHearingRequest.Participants = new List<EditParticipantRequest>();
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithEndpointsOriginal);
            var result = await _controller.EditHearing(_validId, _addEndpointToHearingRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(
                x => x.AddEndPointToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddEndpointRequest>()), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        !u.Cases.IsNullOrEmpty() && u.QuestionnaireNotRequired == false)),
                Times.Once);
            _bookingsApiClient.Verify(
                x => x.UpdateDisplayNameForEndpointAsync(It.IsAny<Guid>(), It.IsAny<Guid>(),
                    It.IsAny<UpdateEndpointRequest>()), Times.Exactly(3));
        }

        [Test]
        public async Task Should_update_endpoint_if_an_endpoint_is_updates_in_endpoint_list()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithEndpointsOriginal);
            var result = await _controller.EditHearing(_validId, _addEndpointToHearingRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(
                x => x.UpdateDisplayNameForEndpointAsync(It.IsAny<Guid>(), It.IsAny<Guid>(),
                    It.IsAny<UpdateEndpointRequest>()), Times.Exactly(3));
        }

        [Test]
        public async Task Should_remove_endpoint_if_endpoint_is_removed_from_the_endpoint_list()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithEndpointsOriginal);
            var result = await _controller.EditHearing(_validId, _addEndpointToHearingRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveEndPointFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()),
                Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        !u.Cases.IsNullOrEmpty() && u.QuestionnaireNotRequired == false)),
                Times.Once);
            _bookingsApiClient.Verify(
                x => x.UpdateDisplayNameForEndpointAsync(It.IsAny<Guid>(), It.IsAny<Guid>(),
                    It.IsAny<UpdateEndpointRequest>()), Times.Exactly(3));
        }

        [Test]
        public async Task If_Judge_Added_To_Hearing_And_Saved_Should_Auto_confirm_booking()
        {
            // arrange - original hearing
            var hearingId = _updatedExistingParticipantHearingOriginal.Id;
            var originalHearing = _updatedExistingParticipantHearingOriginal.Duplicate();
            var updatedHearing = _updatedExistingParticipantHearingOriginal.Duplicate();
            updatedHearing.Participants.Add(new ParticipantResponse{
                DisplayName = "newJudge",
                HearingRoleName = RoleNames.Judge,
                CaseRoleName = RoleNames.Judge,
                UserRoleName = RoleNames.Judge,
                ContactEmail = "judge@moj.gov.uk"
            });
            originalHearing.Status = BookingStatus.Booked;
            _bookingsApiClient.Setup(x => x.GetHearingsByGroupIdAsync(originalHearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> {originalHearing});
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(hearingId))
                .ReturnsAsync(originalHearing)
                .ReturnsAsync(updatedHearing);
            // arrange - request
            var request = new EditHearingRequest();
            request.Case = new EditCaseRequest();
            request.Participants.Add(new EditParticipantRequest
            {
                DisplayName = "newJudge",
                HearingRoleName = RoleNames.Judge,
                CaseRoleName = RoleNames.Judge,
                ContactEmail = "judge@moj.gov.uk"
            });
            //Act
            var result = await _controller.EditHearing(hearingId, request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            
            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(It.IsAny<Guid>(),It.IsAny<UpdateBookingStatusRequest>()), Times.AtLeastOnce);
        }
        
        [Test]
        public async Task Should_not_update_DisplayName_if_no_matching_endpoint_exists_in_list()
        {
            _existingHearingWithEndpointsOriginal.Endpoints[0].Id = Guid.NewGuid();
            _existingHearingWithEndpointsOriginal.Endpoints[1].DisplayName = "data2-edit";
            _existingHearingWithEndpointsOriginal.Endpoints[1].DefenceAdvocateId = null;
            _existingHearingWithEndpointsOriginal.Endpoints[3].DisplayName = "data4-edit";
            _existingHearingWithEndpointsOriginal.Endpoints[3].DefenceAdvocateId = null;
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithEndpointsOriginal);
            var result = await _controller.EditHearing(_validId, _addEndpointToHearingRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveEndPointFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()),
                Times.Exactly(2));
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u =>
                        !u.Cases.IsNullOrEmpty() && u.QuestionnaireNotRequired == false)),
                Times.Once);
            _bookingsApiClient.Verify(
                x => x.UpdateDisplayNameForEndpointAsync(It.IsAny<Guid>(), It.IsAny<Guid>(),
                    It.IsAny<UpdateEndpointRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_process_participants()
        {
            //Arrange
            var existingLinkedParticipantOne = _existingHearingWithLinkedParticipants.Participants.FirstOrDefault(x => x.LinkedParticipants.Any());
            var existingLinkedParticipantTwo =
                _existingHearingWithLinkedParticipants.Participants
                .SingleOrDefault(x => x.Id == existingLinkedParticipantOne.LinkedParticipants[0].LinkedId);

            var editPrefix = "Edited";
            var updatedExistingLinkedParticipantOne = new EditParticipantRequest
            {
                Id = existingLinkedParticipantOne.Id,
                ContactEmail = existingLinkedParticipantOne.ContactEmail,
                FirstName = editPrefix + existingLinkedParticipantOne.FirstName,
                LastName = editPrefix + existingLinkedParticipantOne.LastName,
                LinkedParticipants = new List<LinkedParticipant>
                    {
                        new LinkedParticipant
                        {
                            LinkedId = existingLinkedParticipantTwo.Id,
                            LinkedParticipantContactEmail = existingLinkedParticipantTwo.ContactEmail,
                            ParticipantContactEmail = existingLinkedParticipantOne.ContactEmail
                        }
                    }
            };

            var updatedExistingLinkedParticipantTwo = new EditParticipantRequest
            {
                Id = existingLinkedParticipantTwo.Id,
                ContactEmail = existingLinkedParticipantTwo.ContactEmail,
                FirstName = editPrefix + existingLinkedParticipantTwo.FirstName,
                LastName = editPrefix + existingLinkedParticipantTwo.LastName,
                LinkedParticipants = new List<LinkedParticipant>
                    {
                        new LinkedParticipant
                        {
                            LinkedId = existingLinkedParticipantOne.Id,
                            LinkedParticipantContactEmail = existingLinkedParticipantTwo.ContactEmail,
                            ParticipantContactEmail = existingLinkedParticipantTwo.ContactEmail
                        }
                    }
            };

            var newParticipant = new EditParticipantRequest
            {
                ContactEmail = "ContactEmail",
                FirstName = "Hi",
                LastName = "Hello",
            };

            _addNewParticipantRequest.Participants = new List<EditParticipantRequest>
            {
                updatedExistingLinkedParticipantOne,
                updatedExistingLinkedParticipantTwo,
                newParticipant
            };

            var removedParticipantIds = _existingHearingWithLinkedParticipants.Participants
                .Where(p => _addNewParticipantRequest.Participants.All(rp => rp.Id != p.Id)).Select(x => x.Id).ToList();

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithLinkedParticipants);

            //Act
            var response = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            response.Result.Should().BeOfType<OkObjectResult>();

            Func<List<Guid>, List<Guid>, bool> areRemovedParticipantIdsCorrect = (List<Guid> listOne, List<Guid> listTwo) =>
            {
                foreach (var guid in listOne)
                {
                    if (!listTwo.Contains(guid))
                        return false;
                }

                return true;
            };

            //Assert
            _bookingsApiClient.Verify(x => x.UpdateHearingParticipantsAsync(_validId,
                It.Is<UpdateHearingParticipantsRequest>(participants =>
                    participants.NewParticipants.Count == 1
                    && participants.NewParticipants[0].ContactEmail == newParticipant.ContactEmail
                    && participants.NewParticipants[0].FirstName == newParticipant.FirstName
                    && participants.NewParticipants[0].LastName == newParticipant.LastName

                    && participants.RemovedParticipantIds.Count == removedParticipantIds.Count
                    && areRemovedParticipantIdsCorrect(participants.RemovedParticipantIds, removedParticipantIds)

                    && participants.ExistingParticipants.Count == 2

                    && participants.LinkedParticipants.Count == 1
                    && participants.LinkedParticipants[0].ParticipantContactEmail == existingLinkedParticipantOne.ContactEmail
                    && participants.LinkedParticipants[0].LinkedParticipantContactEmail == existingLinkedParticipantTwo.ContactEmail
             )), Times.Once);
        }

        [Test]
        public async Task Should_add_a_new_participant_and_link_to_existing_interpreter_when_editing_a_hearing()
        {
            var newUserContactEmail = "newindividual4.user@email.com";
            var interpreter =
                _existingHearingWithLinkedParticipants.Participants.First(p =>
                    p.HearingRoleName.ToLower() == "interpreter");

            var partipant4 = Guid.NewGuid();

            var _existingHearingWithNewLinkedParticipants = new HearingDetailsResponse
            {
                Id = _validId,
                GroupId = _validId,
                Cases = _existingHearingWithLinkedParticipants.Cases,
                CaseTypeName = "case type",
                HearingTypeName = "hearing type",
                Participants = new List<ParticipantResponse>
                {
                    new ParticipantResponse
                    {
                        Id = _existingHearingWithLinkedParticipants.Participants[0].Id, CaseRoleName = "judge", HearingRoleName = "hearingrole",
                        ContactEmail = "judge.user@email.com", UserRoleName = "Judge", FirstName = "Judge",
                        LinkedParticipants = null
                    },
                    new ParticipantResponse
                    {
                        Id = _existingHearingWithLinkedParticipants.Participants[1].Id, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual.user@email.com", UserRoleName = "Individual",
                        FirstName = "testuser1", LinkedParticipants = null
                    },
                    new ParticipantResponse
                    {
                        Id = interpreter.Id, CaseRoleName = "caserole", HearingRoleName = "interpreter",
                        ContactEmail = "interpreter.user@email.com", UserRoleName = "Individual",
                        FirstName = "testuser1",
                        LinkedParticipants = new List<LinkedParticipantResponse>
                        {
                            new LinkedParticipantResponse
                                {Type = LinkedParticipantType.Interpreter, LinkedId = partipant4}
                        }
                    },
                    new ParticipantResponse
                    {
                        Id = partipant4, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual4.user@email.com", UserRoleName = "Individual4",
                        FirstName = "testuser4", LinkedParticipants = null
                    }
                },
                ScheduledDateTime = DateTime.UtcNow.AddHours(3),
                OtherInformation = ""
            };

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>())).ReturnsAsync(_existingHearingWithNewLinkedParticipants);


            var addParticipantLinksToHearingRequest = new EditHearingRequest
            {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                Participants = new List<EditParticipantRequest>
                {
                     new EditParticipantRequest
                    {
                         Id = _existingHearingWithLinkedParticipants.Participants[0].Id, CaseRoleName = "judge", HearingRoleName = "hearingrole",
                        ContactEmail = "judge.user@email.com", FirstName = "Judge", TelephoneNumber = "003"
                    },
                      new EditParticipantRequest
                    {
                         Id = _existingHearingWithLinkedParticipants.Participants[1].Id, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual.user@email.com",
                        FirstName = "testuser1", TelephoneNumber = "001"
                    },
                       new EditParticipantRequest
                    {
                       Id = partipant4, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual4.user@email.com",
                        FirstName = "testuser4", TelephoneNumber = "000"
                    },
                    new EditParticipantRequest
                    {
                        CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "newindividual4.user@email.com", DisplayName = "NewIndividual4", FirstName = "NewIndividual4",
                        LastName = "newIndividual4", TelephoneNumber = "000",
                    },
                    new EditParticipantRequest
                    {
                        Id = interpreter.Id,
                        CaseRoleName = "caserole", HearingRoleName = "interpreter",
                        ContactEmail = "interpreter.user@email.com", DisplayName = "newUser", FirstName = "firstName",
                        LastName = "lastName", TelephoneNumber = "000",
                        LinkedParticipants = new List<LinkedParticipant>
                        {
                            new LinkedParticipant
                            {
                                ParticipantContactEmail = "interpreter.user@email.com",
                                LinkedParticipantContactEmail = newUserContactEmail,
                                Type = LinkedParticipantType.Interpreter
                            }
                        }
                    }
                },
                OtherInformation = ""
            };

            var result = await _controller.EditHearing(_validId, addParticipantLinksToHearingRequest);

            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);

            _bookingsApiClient.Verify(
                x => x.UpdateHearingParticipantsAsync(It.IsAny<Guid>(), It.Is<UpdateHearingParticipantsRequest>(x => x.LinkedParticipants.Any(x => x.LinkedParticipantContactEmail == newUserContactEmail))), Times.Once);

            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.QuestionnaireNotRequired == false)), Times.Once);
        }

        [Test]
        public async Task Returns_Valid_When_Linked_Contact_Email_Is_Null_When_Adding_A_New_Participant_To_Existing_Hearing()
        {
            var linkedParticipantEmail = "individual4.user@email.com";
            var interpreter =
                _existingHearingWithLinkedParticipants.Participants.First(p =>
                    p.HearingRoleName.ToLower() == "interpreter");

            var partipant4 = Guid.NewGuid();

            var _existingHearingWithNewLinkedParticipants = new HearingDetailsResponse
            {
                Id = _validId,
                GroupId = _validId,
                Cases = _existingHearingWithLinkedParticipants.Cases,
                CaseTypeName = "case type",
                HearingTypeName = "hearing type",
                Participants = new List<ParticipantResponse>
                {
                    new ParticipantResponse
                    {
                        Id = _existingHearingWithLinkedParticipants.Participants[0].Id, CaseRoleName = "judge", HearingRoleName = "hearingrole",
                        ContactEmail = "judge.user@email.com", UserRoleName = "Judge", FirstName = "Judge",
                        LinkedParticipants = null
                    },
                    new ParticipantResponse
                    {
                        Id = _existingHearingWithLinkedParticipants.Participants[1].Id, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual.user@email.com", UserRoleName = "Individual",
                        FirstName = "testuser1", LinkedParticipants = null
                    },
                    new ParticipantResponse
                    {
                        Id = interpreter.Id, CaseRoleName = "caserole", HearingRoleName = "interpreter",
                        ContactEmail = "interpreter.user@email.com", UserRoleName = "Individual",
                        FirstName = "testuser1",
                        LinkedParticipants = new List<LinkedParticipantResponse>
                        {
                            new LinkedParticipantResponse
                                {Type = LinkedParticipantType.Interpreter, LinkedId = partipant4}
                        }
                    },
                    new ParticipantResponse
                    {
                        Id = partipant4, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = linkedParticipantEmail, UserRoleName = "Individual4",
                        FirstName = "testuser4", LinkedParticipants = null
                    }
                },
                ScheduledDateTime = DateTime.UtcNow.AddHours(3),
                OtherInformation = ""
            };

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>())).ReturnsAsync(_existingHearingWithNewLinkedParticipants);


            var addParticipantLinksToHearingRequest = new EditHearingRequest
            {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                Participants = new List<EditParticipantRequest>
                {
                     new EditParticipantRequest
                    {
                         Id = _existingHearingWithLinkedParticipants.Participants[0].Id, CaseRoleName = "judge", HearingRoleName = "hearingrole",
                        ContactEmail = "judge.user@email.com", FirstName = "Judge", TelephoneNumber = "003"
                    },
                      new EditParticipantRequest
                    {
                         Id = _existingHearingWithLinkedParticipants.Participants[1].Id, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual.user@email.com",
                        FirstName = "testuser1", TelephoneNumber = "001"
                    },
                       new EditParticipantRequest
                    {
                       Id = partipant4, CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "individual4.user@email.com",
                        FirstName = "testuser4", TelephoneNumber = "000"
                    },
                    new EditParticipantRequest
                    {
                        CaseRoleName = "caserole", HearingRoleName = "litigant in person",
                        ContactEmail = "newindividual4.user@email.com", DisplayName = "NewIndividual4", FirstName = "NewIndividual4",
                        LastName = "newIndividual4", TelephoneNumber = "000",
                    },
                    new EditParticipantRequest
                    {
                        Id = interpreter.Id,
                        CaseRoleName = "caserole", HearingRoleName = "interpreter",
                        ContactEmail = "interpreter.user@email.com", DisplayName = "newUser", FirstName = "firstName",
                        LastName = "lastName", TelephoneNumber = "000",
                        LinkedParticipants = new List<LinkedParticipant>
                        {
                            new LinkedParticipant
                            {
                                LinkedId = partipant4,
                                Type = LinkedParticipantType.Interpreter,
                                LinkedParticipantContactEmail = null
                            }
                        }
                    }
                },
                OtherInformation = ""
            };

            var result = await _controller.EditHearing(_validId, addParticipantLinksToHearingRequest);

            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);

            _bookingsApiClient.Verify(
                x => x.UpdateHearingParticipantsAsync(It.IsAny<Guid>(), It.Is<UpdateHearingParticipantsRequest>(x => x.LinkedParticipants.Any(x => x.LinkedParticipantContactEmail == linkedParticipantEmail))), Times.Once);

            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                    It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.QuestionnaireNotRequired == false)), Times.Once);
        }

        [TestCase(BookingStatus.Booked, 0)]
        [TestCase(BookingStatus.Created, 1)]
        public async Task
            Should_correctly_decide_when_to_send_judge_hearing_confirm_email_on_edit_when_email_has_been_updated(
                BookingStatus status, int timeSent)
        {
            // arrange
            var hearingId = _updatedExistingParticipantHearingOriginal.Id;
            var newJudgeEmailOtherInfo = new OtherInformationDetails { JudgeEmail = "judgenew@hmcts.net" };
            var updatedHearing = _updatedExistingParticipantHearingOriginal.Duplicate();
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                UserRoleName = "Judge"
            });
            updatedHearing.CaseTypeName = "Unit Test";
            updatedHearing.Cases[0].Name = "Case";
            updatedHearing.Cases[0].Number = "123";
            updatedHearing.OtherInformation = newJudgeEmailOtherInfo.ToOtherInformationString();
            updatedHearing.Status = status;

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(hearingId))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing)
                .ReturnsAsync(updatedHearing);

            _bookingsApiClient.Setup(x => x.GetHearingsByGroupIdAsync(updatedHearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> { updatedHearing });
            var request = new EditHearingRequest
            {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                OtherInformation = updatedHearing.OtherInformation
            };

            // act
            var result = await _controller.EditHearing(hearingId, request);

            // assert
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _notificationApiMock.Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()),
                Times.Exactly(timeSent));
        }

        [Test]
        public async Task Should_not_be_able_to_remove_judge_from_confirmed_hearing()
        {
            // arrange
            var hearingId = _updatedExistingParticipantHearingOriginal.Id;
            var updatedHearing = _updatedExistingParticipantHearingOriginal.Duplicate();
            updatedHearing.Status = BookingStatus.Created;
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(hearingId))
                .ReturnsAsync(updatedHearing);
            _bookingsApiClient.Setup(x => x.GetHearingsByGroupIdAsync(updatedHearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> { updatedHearing });
            
            // act
            var result = await _controller.EditHearing(hearingId, It.IsAny<EditHearingRequest>());

            // assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }
        
        private void GivenApiThrowsExceptionOnUpdate(HttpStatusCode code)
        {
            _bookingsApiClient.Setup(x =>
                    x.UpdateHearingDetailsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingRequest>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(code));
        }
    }
}