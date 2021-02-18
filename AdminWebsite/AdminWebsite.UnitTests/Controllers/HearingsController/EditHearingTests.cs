using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.Services.Models;
using AdminWebsite.UnitTests.Helper;
using Castle.Core.Internal;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NotificationApi.Client;
using NotificationApi.Contract;
using NotificationApi.Contract.Requests;
using NUnit.Framework;
using VideoApi.Client;
using CaseResponse = AdminWebsite.BookingsAPI.Client.CaseResponse;
using AddEndpointRequest = AdminWebsite.BookingsAPI.Client.AddEndpointRequest;
using LinkedParticipantResponse = AdminWebsite.BookingsAPI.Client.LinkedParticipantResponse;
using LinkedParticipantType = AdminWebsite.BookingsAPI.Client.LinkedParticipantType;
using UpdateEndpointRequest = AdminWebsite.BookingsAPI.Client.UpdateEndpointRequest;
using UpdateParticipantRequest = AdminWebsite.BookingsAPI.Client.UpdateParticipantRequest;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class EditHearingTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IUserAccountService> _userAccountService;
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private Mock<IVideoApiClient> _videoApiMock;
        private Mock<IPollyRetryService> _pollyRetryServiceMock;
        private Mock<INotificationApiClient> _notificationApiMock;

        private Guid _validId;
        private EditHearingRequest _addNewParticipantRequest;
        private EditHearingRequest _addEndpointToHearingRequest;
        private HearingDetailsResponse _updatedExistingParticipantHearingOriginal;
        private HearingDetailsResponse _existingHearingWithEndpointsOriginal;
        private HearingDetailsResponse _existingHearingWithoutLinkedParticipants;
        private HearingDetailsResponse _existingHearingWithLinkedParticipants;

        private Mock<ILogger<HearingsService>> _participantGroupLogger;
        private IHearingsService _hearingsService;

        private AdminWebsite.Controllers.HearingsController _controller;

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

            _participantGroupLogger = new Mock<ILogger<HearingsService>>();
            _hearingsService = new HearingsService(_pollyRetryServiceMock.Object,
                _userAccountService.Object, _notificationApiMock.Object, _videoApiMock.Object, _bookingsApiClient.Object, _participantGroupLogger.Object);

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService.Object,
                _editHearingRequestValidator.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _hearingsService);

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
                        ContactEmail = "new@user.com",
                        FirstName = "Test_FirstName",
                        LastName = "Test_LastName"
                    }
                }
            };

            var cases = new List<CaseResponse>
            {
                new CaseResponse {Name = "Case", Number = "123"}
            };

            _updatedExistingParticipantHearingOriginal = new HearingDetailsResponse
            {
                Participants = new List<ParticipantResponse>
                {
                    new ParticipantResponse
                    {
                        Id = Guid.NewGuid(),
                        User_role_name = "Individual",
                        Contact_email = "old@user.com",
                        Username = "old@user.com"
                    }
                },
                Cases = cases
            };

            _updatedExistingParticipantHearingOriginal = new HearingDetailsResponse
            {
                Participants = new List<ParticipantResponse>
                {
                    new ParticipantResponse
                    {
                        Id = Guid.NewGuid(),
                        User_role_name = "Individual",
                        Contact_email = "old@user.com",
                        Username = "old@user.com"
                    }
                },
                Cases = cases,
                Case_type_name = "Unit Test"
            };

            var participant1 = Guid.NewGuid();
            var participant2 = Guid.NewGuid();
            var participant3 = Guid.NewGuid();
            _existingHearingWithoutLinkedParticipants = new HearingDetailsResponse
            { Cases = cases, Case_type_name = "case type", Hearing_type_name = "hearing type",
                Participants = new List<ParticipantResponse> { 
                    new ParticipantResponse { Id = participant1, Case_role_name="judge", Hearing_role_name = "hearingrole", Contact_email = "judge.user@email.com",  User_role_name = "Judge", First_name  ="Judge", Linked_participants = null },
                    new ParticipantResponse { Id = participant2, Case_role_name="litigant in person", Hearing_role_name = "hearingrole", Contact_email = "individual.user@email.com", User_role_name = "Individual", First_name  ="testuser1", Linked_participants = null },
                }
            };
            _existingHearingWithLinkedParticipants = new HearingDetailsResponse
            {
                Cases = cases,
                Case_type_name = "case type",
                Hearing_type_name = "hearing type",
                Participants = new List<ParticipantResponse> {
                    new ParticipantResponse { Id = participant1, Case_role_name="judge", Hearing_role_name = "hearingrole", Contact_email = "judge.user@email.com",  User_role_name = "Judge", First_name  ="Judge", Linked_participants = null },
                    new ParticipantResponse { Id = participant2, Case_role_name="caserole", Hearing_role_name = "litigant in person", Contact_email = "individual.user@email.com", User_role_name = "Individual", First_name  ="testuser1", Linked_participants = null },
                    new ParticipantResponse { Id = participant3, Case_role_name="caserole", Hearing_role_name = "interpreter", Contact_email = "interpreter.user@email.com", User_role_name = "Individual", First_name  ="testuser1",
                        Linked_participants = new List<LinkedParticipantResponse> { new LinkedParticipantResponse { Type = LinkedParticipantType.Interpreter, Linked_id = participant2 } } },
                }
            };

            var guid1 = Guid.NewGuid();
            var guid2 = Guid.NewGuid();
            var guid3 = Guid.NewGuid();
            var guid4 = Guid.NewGuid();
            _addEndpointToHearingRequest = new EditHearingRequest
            {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                Participants = new List<EditParticipantRequest>(),
                Endpoints = new List<EditEndpointRequest> {
                    new EditEndpointRequest {  Id = null, DisplayName = "New Endpoint" , DefenceAdvocateUsername = "username@email.com" },
                    new EditEndpointRequest {  Id = guid1, DisplayName = "data1", DefenceAdvocateUsername = "edit-user@email.com" },
                    new EditEndpointRequest {  Id = guid2, DisplayName = "data2-edit" },
                    new EditEndpointRequest {  Id = guid4, DisplayName = "data4-edit", DefenceAdvocateUsername = "" },
                }
            };

            _existingHearingWithEndpointsOriginal = new HearingDetailsResponse
            {
                Endpoints = new List<EndpointResponse>
                {
                    new EndpointResponse { Display_name = "data1", Id = guid1,  Pin= "0000", Sip = "1111111111" },
                    new EndpointResponse { Display_name = "data2", Id = guid2,  Pin= "1111", Sip = "2222222222", Defence_advocate_id = Guid.NewGuid() },
                    new EndpointResponse { Display_name = "data3", Id = guid3,  Pin= "2222", Sip = "5544332234" },
                    new EndpointResponse { Display_name = "data4", Id = guid4,  Pin= "2222", Sip = "5544332234", Defence_advocate_id = Guid.NewGuid() },
                },
                Cases = cases,
                Case_type_name = "Unit Test"
            };

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal);

            _editHearingRequestValidator.Setup(x => x.Validate(It.IsAny<EditHearingRequest>())).Returns(new ValidationResult());
            _userAccountService
                .Setup(x => x.UpdateParticipantUsername(It.IsAny<BookingsAPI.Client.ParticipantRequest>()))
                .Callback<BookingsAPI.Client.ParticipantRequest>(p => p.Username = p.Contact_email)
                .ReturnsAsync(new User());

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
        public async Task Should_return_not_found_if_hearing_is_missing()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var notFoundResult = (NotFoundObjectResult)result.Result;
            notFoundResult.Value.Should().Be($"No hearing with id found [{_validId}]");
        }

        [Test]
        public async Task Should_add_participants_without_id()
        {
            var updatedHearing = _updatedExistingParticipantHearingOriginal = new HearingDetailsResponse
            {
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                Case_type_name = "Unit Test"
            };
            updatedHearing.Participants[0].First_name = "New user firstname";
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com",
                User_role_name = "Individual"
            });
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);

            _addNewParticipantRequest.Participants[0].FirstName = "New user firstname";

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_send_email_for_new_individual_participant_added()
        {
            var userName = "old@user.com";
            var updatedHearing = _updatedExistingParticipantHearingOriginal = new HearingDetailsResponse
            {
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                Case_type_name = "Unit Test"
            };
            updatedHearing.Participants[0].First_name = "New user firstname";
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com",
                Telephone_number = "030434545",
                User_role_name = "Individual"
            });
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);

            _userAccountService
                .Setup(x => x.UpdateParticipantUsername(It.IsAny<BookingsAPI.Client.ParticipantRequest>()))
                .Callback<BookingsAPI.Client.ParticipantRequest>(p => p.Username = userName)
                .ReturnsAsync(new User { UserName = userName, Password = "test123" });

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);

            var participant = updatedHearing.Participants[0];
            _notificationApiMock.Verify(x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(r =>
                    r.MessageType == MessageType.Email &&
                    r.NotificationType == NotificationType.CreateIndividual &&
                    r.ContactEmail == participant.Contact_email &&
                    r.PhoneNumber == participant.Telephone_number &&
                    r.Parameters.ContainsKey("name") && r.Parameters["name"] == $"{participant.First_name} {participant.Last_name}" &&
                    r.Parameters.ContainsKey("username") && r.Parameters["username"] == participant.Username &&
                    r.Parameters.ContainsKey("random password") && r.Parameters["random password"] == "test123"
                    )), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_send_email_with_only_matching_participant()
        {
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest
            {
                ContactEmail = "new2@user.com",
                FirstName = "Test2_FirstName",
                LastName = "Test2_LastName",
            });
            var userName = "old@user.com";
            var updatedHearing = _updatedExistingParticipantHearingOriginal = new HearingDetailsResponse
            {
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                Case_type_name = "Unit Test",
                Scheduled_date_time = _updatedExistingParticipantHearingOriginal.Scheduled_date_time
            };
            updatedHearing.Participants[0].First_name = "New user firstname";
            updatedHearing.Participants[0].Username = "old1@user.com";
            var newParticipant = new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com",
                Telephone_number = "030434545",
                User_role_name = "Individual"
            };
            updatedHearing.Participants.Add(newParticipant);

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);

            _userAccountService
                .Setup(x => x.UpdateParticipantUsername(It.Is<BookingsAPI.Client.ParticipantRequest>(r => r.Contact_email == "new@user.com")))
                .Callback<BookingsAPI.Client.ParticipantRequest>(p => p.Username = userName)
                .ReturnsAsync(new User { UserName = userName, Password = "test123" });

            _userAccountService
              .Setup(x => x.UpdateParticipantUsername(It.Is<BookingsAPI.Client.ParticipantRequest>(r => r.Contact_email == "new2@user.com")))
              .Callback<BookingsAPI.Client.ParticipantRequest>(p => p.Username = "old1@user.com")
              .ReturnsAsync(new User { UserName = "old1@user.com", Password = "test123" });

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
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
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
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_update_existing_participants()
        {
            _addNewParticipantRequest.Participants[0].Id = _updatedExistingParticipantHearingOriginal.Participants[0].Id;

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateParticipantRequest>()), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_not_update_existing_participants_if_participant_not_found_in_hearing()
        {
            _addNewParticipantRequest.Participants[0].Id = Guid.NewGuid();

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateParticipantRequest>()), Times.Never);
        }

        [Test]
        public async Task Should_not_update_existing_participants_if_user_role_is_not_defined()
        {
            _addNewParticipantRequest.Participants[0].Id = _updatedExistingParticipantHearingOriginal.Participants[0].Id;
            _updatedExistingParticipantHearingOriginal.Participants[0].User_role_name = "";

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateParticipantRequest>()), Times.Never);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_add_judge_if_no_any_records_for_judge_exists_in_database()
        {
            _addNewParticipantRequest.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _updatedExistingParticipantHearingOriginal.Participants.ForEach(x => x.Username = "notexisting@judge.com");
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                User_role_name = "Individual",
                Contact_email = "old@user.com",
                Username = "other@judge.com"
            });

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_not_add_judge_if_the_records_for_judge_exists_in_database()
        {
            _addNewParticipantRequest.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _updatedExistingParticipantHearingOriginal.Participants.ForEach(x => x.Username = "existing@judge.com");
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                User_role_name = "Individual",
                Contact_email = "old@user.com",
                Username = "existing@judge.com"
            });

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Never);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }
        [Test]
        public async Task Should_not_add_judge_if_one_record_for_judge_exists_in_database()
        {
            _addNewParticipantRequest.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _updatedExistingParticipantHearingOriginal.Participants.ForEach(x => x.Username = "existing@judge.com");

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Never);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_add_judge_if_participants_list_of_the_hearing_null()
        {
            _addNewParticipantRequest.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _updatedExistingParticipantHearingOriginal.Participants = null;

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_add_judge_if_no_any_participants_in_the_list_for_the_hearing()
        {
            _addNewParticipantRequest.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _updatedExistingParticipantHearingOriginal.Participants = new List<ParticipantResponse>();

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_update_judge_display_name()
        {
            var existingJudgeId = Guid.NewGuid();
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse
            {
                First_name = "Existing",
                Last_name = "Judge",
                Contact_email = "existing@judge.com",
                Username = "existing@judge.com",
                Case_role_name = "Judge",
                User_role_name = "Judge",
                Id = existingJudgeId
            });
            var judgeIndex =
                _updatedExistingParticipantHearingOriginal.Participants.FindIndex(x => x.Id == existingJudgeId);

            const string newJudgeEmail = "new@judge.com";
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest
            {
                CaseRoleName = "Judge",
                FirstName = "New",
                LastName = "Judge",
                ContactEmail = newJudgeEmail
            });
            _addNewParticipantRequest.Participants[1].Id = _updatedExistingParticipantHearingOriginal.Participants[1].Id;

            var newPats = _updatedExistingParticipantHearingOriginal.Participants;
            newPats.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com",
                User_role_name = "Individual"
            });
            var judge = newPats.First(x => x.Case_role_name == "Judge");

            judge.Case_role_name = "Judge";
            judge.First_name = "New";
            judge.Last_name = "Judge";
            judge.Contact_email = newJudgeEmail;

            var updatedHearing = new HearingDetailsResponse
            {
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                Case_type_name = "Unit Test"
            };
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com",
                User_role_name = "Individual"
            });
            updatedHearing.Participants[judgeIndex] = judge;

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateParticipantRequest>()), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_delete_missing_participants()
        {
            var removedUserId = _updatedExistingParticipantHearingOriginal.Participants[0].Id;
            var updatedPatList = _updatedExistingParticipantHearingOriginal.Participants
                .Where(x => x.Id != removedUserId).ToList();
            var updatedHearing = new HearingDetailsResponse
            {
                Participants = updatedPatList,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                Case_type_name = "Unit Test"
            };
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com",
                User_role_name = "Individual"
            });
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);


            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), removedUserId), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_not_delete_existing_participant_if_participant_with_the_same_id_in_the_list_of_updated_hearing()
        {
            _updatedExistingParticipantHearingOriginal.Participants = new List<ParticipantResponse>();
            var updatedHearing = new HearingDetailsResponse
            {
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                Case_type_name = "Unit Test"
            };
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com",
                User_role_name = "Individual"
            });
            _addNewParticipantRequest.Participants[0].Id = updatedHearing.Participants[0].Id;

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);


            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Never);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }


        [Test]
        public async Task Should_delete_missing_participant_from_hearing_if_no_any_participants_in_the_request()
        {
            _addNewParticipantRequest.Participants = new List<EditParticipantRequest>();

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(), It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty())), Times.Once);
        }
        [Test]
        public async Task Should_not_delete_missing_participant_if_no_any_participants()
        {
            _updatedExistingParticipantHearingOriginal.Participants = new List<ParticipantResponse>();
            _addNewParticipantRequest.Participants = new List<EditParticipantRequest>();
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Never);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_delete_two_missing_participant_if_two_with_no_matching_id_exist_for_the_hearing()
        {
            _addNewParticipantRequest.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _updatedExistingParticipantHearingOriginal.Participants.ForEach(x => x.Contact_email = "old@judge.com");
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                User_role_name = "Individual",
                Contact_email = "old@judge.com",
                Username = "old@judge.com"
            });

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Exactly(2));
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_not_delete_missing_participant_if_all_match_id_for_updated_hearing()
        {
            _addNewParticipantRequest.Participants.ForEach(x => { x.ContactEmail = "old@judge.com"; x.CaseRoleName = "Judge"; });
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest { ContactEmail = "old@judge.com" });
            _updatedExistingParticipantHearingOriginal.Participants.ForEach(x => x.Contact_email = "old@judge.com");
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                User_role_name = "Individual",
                Contact_email = "old@judge.com",
                Username = "old@judge.com"
            });

            var idFirstParticipant = _updatedExistingParticipantHearingOriginal.Participants[0].Id;
            var idSecondParticipant = _updatedExistingParticipantHearingOriginal.Participants[1].Id;

            _addNewParticipantRequest.Participants[0].Id = idFirstParticipant;
            _addNewParticipantRequest.Participants[1].Id = idSecondParticipant;

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Never);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_return_updated_hearing()
        {
            var updatedHearing = new HearingDetailsResponse
            {
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                Case_type_name = "Unit Test"
            };
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com",
                User_role_name = "Individual"
            });

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var hearing = (HearingDetailsResponse)((OkObjectResult)result.Result).Value;
            hearing.Id.Should().Be(_updatedExistingParticipantHearingOriginal.Id);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
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
            GivenApiThrowsExceptionOnUpdate(HttpStatusCode.NotFound);

            var response = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            response.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Test]
        public async Task Should_replace_judge_based_on_email()
        {
            var existingJudgeId = Guid.NewGuid();
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse
            {
                First_name = "Existing",
                Last_name = "Judge",
                Contact_email = "existing@judge.com",
                Username = "existing@judge.com",
                Case_role_name = "Judge",
                Id = existingJudgeId
            });

            const string newJudgeEmail = "new@judge.com";
            _addNewParticipantRequest.Participants.Add(new EditParticipantRequest
            {
                CaseRoleName = "Judge",
                FirstName = "New",
                LastName = "Judge",
                ContactEmail = newJudgeEmail
            });

            var newPats = _updatedExistingParticipantHearingOriginal.Participants.Where(x => x.Id != existingJudgeId)
                .ToList();
            newPats.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com",
                User_role_name = "Individual"
            });
            newPats.Add(new ParticipantResponse
            {
                Case_role_name = "Judge",
                First_name = "New",
                Last_name = "Judge",
                Contact_email = newJudgeEmail,
                Username = newJudgeEmail,
                User_role_name = "Judge"
            });
            var updatedHearing = new HearingDetailsResponse
            {
                Participants = newPats,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                Case_type_name = "Unit Test"
            };

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);

            var response = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            response.Result.Should().BeOfType<OkObjectResult>();

            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(_validId, existingJudgeId), Times.Once);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(_validId, It.Is<AddParticipantsToHearingRequest>(
                participants => participants.Participants.Any(p => p.Username == newJudgeEmail))), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
        }

        [Test]
        public async Task Should_add_endpoint_if_new_endpoint_is_added_to_endpoint_list()
        {
            _addEndpointToHearingRequest.Participants = new List<EditParticipantRequest>();
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithEndpointsOriginal);
            var result = await _controller.EditHearing(_validId, _addEndpointToHearingRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddEndPointToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddEndpointRequest>()), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateDisplayNameForEndpointAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateEndpointRequest>()), Times.Exactly(3));
        }
        [Test]
        public async Task Should_update_endpoint_if_an_endpoint_is_updates_in_endpoint_list()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>())).ReturnsAsync(_existingHearingWithEndpointsOriginal);
            var result = await _controller.EditHearing(_validId, _addEndpointToHearingRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateDisplayNameForEndpointAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateEndpointRequest>()), Times.Exactly(3));
        }
        [Test]
        public async Task Should_remove_endpoint_if_endpoint_is_removed_from_the_endpoint_list()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>())).ReturnsAsync(_existingHearingWithEndpointsOriginal);
            var result = await _controller.EditHearing(_validId, _addEndpointToHearingRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveEndPointFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateDisplayNameForEndpointAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateEndpointRequest>()), Times.Exactly(3));
        }

        [Test]
        public async Task Should_not_update_display_name_if_no_matching_endpoint_exists_in_list()
        {
            _existingHearingWithEndpointsOriginal.Endpoints[0].Id = Guid.NewGuid();
            _existingHearingWithEndpointsOriginal.Endpoints[1].Display_name = "data2-edit";
            _existingHearingWithEndpointsOriginal.Endpoints[1].Defence_advocate_id = null;
            _existingHearingWithEndpointsOriginal.Endpoints[3].Display_name = "data4-edit";
            _existingHearingWithEndpointsOriginal.Endpoints[3].Defence_advocate_id = null;
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>())).ReturnsAsync(_existingHearingWithEndpointsOriginal);
            var result = await _controller.EditHearing(_validId, _addEndpointToHearingRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveEndPointFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Exactly(2));
            _bookingsApiClient.Verify(x => x.UpdateHearingDetailsAsync(It.IsAny<Guid>(),
                It.Is<UpdateHearingRequest>(u => !u.Cases.IsNullOrEmpty() && u.Questionnaire_not_required == false)), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateDisplayNameForEndpointAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateEndpointRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_Update_LinkedParticipants_From_Request()
        {
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                User_role_name = "Individual",
                Contact_email = "link@user.com",
                Username = "link@user.com"
            });
            var updatedHearing = new HearingDetailsResponse
            {
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                Case_type_name = "Unit Test"
            };
            var individual =
                _updatedExistingParticipantHearingOriginal.Participants.First(x =>
                    x.User_role_name.ToLower() == "individual");

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);

            var addParticipantLinksToHearingRequest = new EditHearingRequest
            {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                Participants = new List<EditParticipantRequest>
                {
                    new EditParticipantRequest
                    {
                        Id = individual.Id,
                        LinkedParticipants = new List<LinkedParticipant>
                        {
                            new LinkedParticipant
                            {
                                Id = Guid.NewGuid(),
                                ParticipantId = _updatedExistingParticipantHearingOriginal.Participants[0].Id,
                                LinkedId = _updatedExistingParticipantHearingOriginal.Participants[1].Id,
                                Type = LinkedParticipantType.Interpreter
                            }
                        }
                    }
                }
            };

            var result = await _controller.EditHearing(_validId, addParticipantLinksToHearingRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(
                _validId, individual.Id,
                It.IsAny<UpdateParticipantRequest>()), Times.AtLeastOnce);
        }

        [Test]
        public async Task Should_Not_Update_LinkedParticipants_If_Link_Already_Exists()
        {
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                User_role_name = "Individual",
                Contact_email = "link@user.com",
                Username = "link@user.com"
            });
            _updatedExistingParticipantHearingOriginal.Participants[0].Linked_participants = new List<LinkedParticipantResponse>
            {
                new LinkedParticipantResponse
                {
                    Linked_id = _updatedExistingParticipantHearingOriginal.Participants[1].Id,
                    Type = LinkedParticipantType.Interpreter
                }
            };

            var updatedHearing = new HearingDetailsResponse
            {
                Participants = _updatedExistingParticipantHearingOriginal.Participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                Case_type_name = "Unit Test"
            };
            var individual = _updatedExistingParticipantHearingOriginal.Participants.First(x =>
                    x.User_role_name.ToLower() == "individual");

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);

            var addParticipantLinksToHearingRequest = new EditHearingRequest
            {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                Participants = new List<EditParticipantRequest>
                {
                    new EditParticipantRequest
                    {
                        Id = individual.Id,
                        LinkedParticipants = new List<LinkedParticipant>
                        {
                            new LinkedParticipant
                            {
                                Id = Guid.NewGuid(),
                                ParticipantId = _updatedExistingParticipantHearingOriginal.Participants[0].Id,
                                LinkedId = _updatedExistingParticipantHearingOriginal.Participants[1].Id,
                                Type = LinkedParticipantType.Interpreter
                            }
                        }
                    }
                }
            };

            var result = await _controller.EditHearing(_validId, addParticipantLinksToHearingRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(
                _validId, individual.Id,
                It.IsAny<UpdateParticipantRequest>()), Times.AtLeastOnce);
        }

        [Test]
        public async Task Should_Not_Update_LinkedParticipants_If_Not_In_Request()
        {
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                User_role_name = "Individual",
                Contact_email = "link@user.com",
                Username = "link@user.com"
            });
            var individual1 = _updatedExistingParticipantHearingOriginal.Participants[0];
            var individual2 = _updatedExistingParticipantHearingOriginal.Participants[1];

            individual1.Linked_participants = new List<LinkedParticipantResponse>()
            {
                new LinkedParticipantResponse
                {
                    Linked_id = individual2.Id,
                    Type = LinkedParticipantType.Interpreter
                }
            };

            var participants = _updatedExistingParticipantHearingOriginal.Participants;
            var updatedHearing = new HearingDetailsResponse
            {
                Participants = participants,
                Cases = _updatedExistingParticipantHearingOriginal.Cases,
                Case_type_name = "Unit Test"
            };

            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);

            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(updatedHearing.Id, individual1.Id, It.IsAny<UpdateParticipantRequest>()), Times.Never);
        }

        [Test]
        public async Task Should_add_a_participant_interpreter_when_editing_a_hearing()
        {
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearingWithoutLinkedParticipants)
                .ReturnsAsync(_existingHearingWithLinkedParticipants);
            var interpreter = _existingHearingWithLinkedParticipants.Participants.First(p => p.Hearing_role_name.ToLower() == "interpreter");

            var addParticipantLinksToHearingRequest = new EditHearingRequest {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                Participants = new List<EditParticipantRequest> {
                    new EditParticipantRequest {
                        CaseRoleName = "caserole", HearingRoleName = "interpreter", ContactEmail = "interpreter.user@email.com", DisplayName = "newUser", FirstName = "firstName", LastName = "lastName", TelephoneNumber = "000",
                        LinkedParticipants = new List<LinkedParticipant> {
                            new LinkedParticipant {
                                ParticipantContactEmail = "interpreter.user@email.com",
                                LinkedParticipantContactEmail = "individual.user@email.com",
                                Type = LinkedParticipantType.Interpreter
                            }
                        }
                    }
                }
            };

            var result = await _controller.EditHearing(_validId, addParticipantLinksToHearingRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(_validId, interpreter.Id, It.IsAny<UpdateParticipantRequest>()), Times.AtLeastOnce);
        }

        private void GivenApiThrowsExceptionOnUpdate(HttpStatusCode code)
        {
            _bookingsApiClient.Setup(x =>
                    x.UpdateHearingDetailsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingRequest>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(code));
        }
    }
}