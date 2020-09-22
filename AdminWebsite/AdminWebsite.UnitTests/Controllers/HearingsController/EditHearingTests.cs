using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using AdminWebsite.VideoAPI.Client;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using AddEndpointRequest = AdminWebsite.BookingsAPI.Client.AddEndpointRequest;
using UpdateEndpointRequest = AdminWebsite.BookingsAPI.Client.UpdateEndpointRequest;
using UpdateParticipantRequest = AdminWebsite.BookingsAPI.Client.UpdateParticipantRequest;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class EditHearingTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IUserAccountService> _userAccountService;
        private Mock<IValidator<BookNewHearingRequest>> _bookNewHearingRequestValidator;
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private Mock<IVideoApiClient> _videoApiMock;
        private Mock<IPollyRetryService> _pollyRetryServiceMock;

        private Guid _validId;
        private EditHearingRequest _request;
        private EditHearingRequest _requestWithEndpoints;
        private HearingDetailsResponse _existingHearing;
        private HearingDetailsResponse _existingHearingWithEndpoints;

        private AdminWebsite.Controllers.HearingsController _controller;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountService = new Mock<IUserAccountService>();
            _bookNewHearingRequestValidator = new Mock<IValidator<BookNewHearingRequest>>();
            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();
            _videoApiMock = new Mock<IVideoApiClient>();
            _pollyRetryServiceMock = new Mock<IPollyRetryService>();

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService.Object,
                _bookNewHearingRequestValidator.Object,
                _editHearingRequestValidator.Object,
                JavaScriptEncoder.Default,
                _videoApiMock.Object,
                _pollyRetryServiceMock.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object);

            _validId = Guid.NewGuid();
            _request = new EditHearingRequest
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
                        ContactEmail = "new@user.com"
                    }
                }
            };
            
            _existingHearing = new HearingDetailsResponse
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
                }
            };

            var guid1 = Guid.NewGuid();
            var guid2 = Guid.NewGuid();
            var guid3 = Guid.NewGuid();
            var guid4 = Guid.NewGuid();
            _requestWithEndpoints = new EditHearingRequest
            {
                Case = new EditCaseRequest { Name = "Case", Number = "123" },
                Participants = new List<EditParticipantRequest> { new EditParticipantRequest { ContactEmail = "new@user.com" } },
                Endpoints = new List<EditEndpointRequest> { 
                    new EditEndpointRequest {  Id = null, DisplayName = "New Endpoint" , DefenceAdvocateUsername = "username@email.com" },
                    new EditEndpointRequest {  Id = guid1, DisplayName = "data1", DefenceAdvocateUsername = "edit-user@email.com" },
                    new EditEndpointRequest {  Id = guid2, DisplayName = "data2-edit" },
                    new EditEndpointRequest {  Id = guid4, DisplayName = "data4-edit", DefenceAdvocateUsername = "" },
                }
            };

            _existingHearingWithEndpoints = new HearingDetailsResponse 
            { 
                Endpoints = new List<BookingsAPI.Client.EndpointResponse> 
                { 
                    new BookingsAPI.Client.EndpointResponse { Display_name = "data1", Id = guid1,  Pin= "0000", Sip = "1111111111" },
                    new BookingsAPI.Client.EndpointResponse { Display_name = "data2", Id = guid2,  Pin= "1111", Sip = "2222222222", Defence_advocate_id = Guid.NewGuid() },
                    new BookingsAPI.Client.EndpointResponse { Display_name = "data3", Id = guid3,  Pin= "2222", Sip = "5544332234" },
                    new BookingsAPI.Client.EndpointResponse { Display_name = "data4", Id = guid4,  Pin= "2222", Sip = "5544332234", Defence_advocate_id = Guid.NewGuid() },
                } 
            };
            
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearing);
            
            _bookNewHearingRequestValidator.Setup(x => x.Validate(It.IsAny<BookNewHearingRequest>())).Returns(new ValidationResult());
            _editHearingRequestValidator.Setup(x => x.Validate(It.IsAny<EditHearingRequest>())).Returns(new ValidationResult());
        }
        
        [Test]
        public async Task Should_return_bad_request_if_invalid_hearing_id()
        {
            var invalidId = Guid.Empty;
            var result = await _controller.EditHearing(invalidId, _request);
            var badRequestResult = (BadRequestObjectResult) result.Result;
            var errors = (SerializableError) badRequestResult.Value;
            errors["hearingId"].Should().BeEquivalentTo(new []{"Please provide a valid hearingId"});
        }
        
        [Test]
        public async Task Should_return_bad_request_if_case_is_not_given()
        {
            _editHearingRequestValidator.Setup(x => x.Validate(It.IsAny<EditHearingRequest>()))
                .Returns(new ValidationResult(new[]
                {
                    new ValidationFailure("case", "Please provide valid case details", new object())
                }));
            
            _request.Case = null;

            var result = await _controller.EditHearing(_validId, _request);
            var badRequestResult = (BadRequestObjectResult) result.Result;
            var errors = (SerializableError) badRequestResult.Value;
            errors["case"].Should().BeEquivalentTo(new []{"Please provide valid case details"});
        }
        
        [Test]
        public async Task Should_return_bad_request_if_no_participants_are_given()
        {
            _editHearingRequestValidator.Setup(x => x.Validate(It.IsAny<EditHearingRequest>()))
                .Returns(new ValidationResult(new[]
                {
                    new ValidationFailure("participants", "Please provide at least one participant", new object())
                }));
            
            _request.Participants.Clear();
            var result = await _controller.EditHearing(_validId, _request);
            var badRequestResult = (BadRequestObjectResult) result.Result;
            var errors = (SerializableError) badRequestResult.Value;
            errors["participants"].Should().BeEquivalentTo(new []{"Please provide at least one participant"});
        }

        [Test]
        public async Task Should_return_not_found_if_hearing_is_missing()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));

            var result = await _controller.EditHearing(_validId, _request);
            var notFoundResult = (NotFoundObjectResult) result.Result;
            notFoundResult.Value.Should().Be($"No hearing with id found [{_validId}]");
        }

        [Test]
        public async Task Should_add_participants_without_id()
        {
            _request.Participants[0].FirstName = "New user firstname";
            
            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult) result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Once);
        }
        
        [Test]
        public async Task Should_update_existing_participants()
        {
            _request.Participants[0].Id = _existingHearing.Participants[0].Id;
            
            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult) result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateParticipantRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_not_update_existing_participants_if_participnt_not_found_in_hearing()
        {
            _request.Participants[0].Id = Guid.NewGuid();

            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateParticipantRequest>()), Times.Never);
        }

        [Test]
        public async Task Should_not_update_existing_participants_if_user_role_is_not_defined()
        {
            _request.Participants[0].Id = _existingHearing.Participants[0].Id;
            _existingHearing.Participants[0].User_role_name = "";

            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateParticipantRequest>()), Times.Never);
        }

        [Test]
        public async Task Should_add_judge_if_no_any_records_for_judge_exists_in_database()
        {
            _request.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _existingHearing.Participants.ForEach(x => x.Username = "notexisting@judge.com");
            _existingHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                User_role_name = "Individual",
                Contact_email = "old@user.com",
                Username = "other@judge.com"
            });

            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(),  It.IsAny<AddParticipantsToHearingRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_not_add_judge_if_the_records_for_judge_exists_in_database()
        {
            _request.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _existingHearing.Participants.ForEach(x => x.Username = "existing@judge.com");
            _existingHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                User_role_name = "Individual",
                Contact_email = "old@user.com",
                Username = "existing@judge.com"
            });

            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Never);
        }
        [Test]
        public async Task Should_not_add_judge_if_one_record_for_judge_exists_in_database()
        {
            _request.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _existingHearing.Participants.ForEach(x => x.Username = "existing@judge.com");

            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Never);
        }

        [Test]
        public async Task Should_add_judge_if_participants_list_of_the_hearing_null()
        {
            _request.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _existingHearing.Participants = null;

            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_add_judge_if_no_any_participants_in_the_list_for_the_hearing()
        {
            _request.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _existingHearing.Participants = new List<ParticipantResponse>();

            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_update_judge_display_name()
        {
            var existingJudgeId = Guid.NewGuid();
            _existingHearing.Participants.Add(new ParticipantResponse
            {
                First_name = "Existing",
                Last_name = "Judge",
                Contact_email = "existing@judge.com",
                Username = "existing@judge.com",
                Case_role_name = "Judge",
                User_role_name = "Judge",
                Id = existingJudgeId
            });

            const string newJudgeEmail = "new@judge.com";
            _request.Participants.Add(new EditParticipantRequest
            {
                CaseRoleName = "Judge",
                FirstName = "New",
                LastName = "Judge",
                ContactEmail = newJudgeEmail
            });
            _request.Participants[1].Id = _existingHearing.Participants[1].Id;

            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateParticipantRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_delete_missing_participants()
        {
            var removedUserId = _existingHearing.Participants[0].Id;
            
            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult) result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), removedUserId), Times.Once);
        }

        [Test]
        public async Task Should_not_delete_missing_participant_if_no_any_participants_in_the_list_for_the_hearing()
        {
            _existingHearing.Participants = new List<ParticipantResponse>();

            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Never);
        }
        [Test]
        public async Task Should_delete_missing_participant_from_hearing_if_no_any_participants_in_the_request()
        {
            _request.Participants = new List<EditParticipantRequest>();

            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Once);
        }
        [Test]
        public async Task Should_not_delete_missing_participant_if_no_any_participants()
        {
            _existingHearing.Participants = new List<ParticipantResponse>();
            _request.Participants = new List<EditParticipantRequest>();
            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Never);
        }

        [Test]
        public async Task Should_delete_two_missing_participant_if_two_with_no_matching_contact_email_exist_for_the_hearing()
        {
            _request.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _existingHearing.Participants.ForEach(x => x.Contact_email= "old@judge.com");
            _existingHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                User_role_name = "Individual",
                Contact_email = "old@judge.com",
                Username = "old@judge.com"
            });

            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Exactly(2));
        }

        [Test]
        public async Task Should_not_delete_missing_participant_if_all_match_contact_email_for_updated_hearing()
        {
            _request.Participants.ForEach(x => { x.ContactEmail = "old@judge.com"; x.CaseRoleName = "Judge"; });
            _request.Participants.Add(new EditParticipantRequest { ContactEmail = "old@judge.com" });
            _existingHearing.Participants.ForEach(x => x.Contact_email = "old@judge.com");
            _existingHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                User_role_name = "Individual",
                Contact_email = "old@judge.com",
                Username = "old@judge.com"
            });

            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Never);
        }

        [Test]
        public async Task Should_return_updated_hearing()
        {
            var result = await _controller.EditHearing(_validId, _request);
            var hearing = (HearingDetailsResponse) ((OkObjectResult) result.Result).Value;
            hearing.Id.Should().Be(_existingHearing.Id);
        }
        
        [Test]
        public async Task Should_pass_on_bad_request_from_bookings_api()
        {
            GivenApiThrowsExceptionOnUpdate(HttpStatusCode.BadRequest);

            var response = await _controller.EditHearing(_validId, _request);
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }
        
        [Test]
        public async Task Should_pass_on_not_found_request_from_bookings_api()
        {
            GivenApiThrowsExceptionOnUpdate(HttpStatusCode.NotFound);

            var response = await _controller.EditHearing(_validId, _request);
            response.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Test]
        public async Task Should_replace_judge_based_on_email()
        {
            var existingJudgeId = Guid.NewGuid();
            _existingHearing.Participants.Add(new ParticipantResponse
            {
                First_name = "Existing",
                Last_name = "Judge",
                Contact_email = "existing@judge.com",
                Username = "existing@judge.com",
                Case_role_name = "Judge",
                Id = existingJudgeId
            });
            
            const string newJudgeEmail = "new@judge.com";
            _request.Participants.Add(new EditParticipantRequest
            {
                CaseRoleName = "Judge",
                FirstName = "New",
                LastName = "Judge",
                ContactEmail = newJudgeEmail
            });

            var response = await _controller.EditHearing(_validId, _request);
            response.Result.Should().BeOfType<OkObjectResult>();

            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(_validId, existingJudgeId), Times.Once);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(_validId, It.Is<AddParticipantsToHearingRequest>(
                participants => participants.Participants.Any(p => p.Username == newJudgeEmail))), Times.Once);
        }

        [Test]
        public async Task Should_add_endpoint_if_new_endpoint_is_added_to_endpoint_list()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>())).ReturnsAsync(_existingHearingWithEndpoints);
            var result = await _controller.EditHearing(_validId, _requestWithEndpoints);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddEndPointToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddEndpointRequest>()), Times.Once);
        }
        [Test]
        public async Task Should_update_endpoint_if_an_endpoint_is_updates_in_endpoint_list()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>())).ReturnsAsync(_existingHearingWithEndpoints);
            var result = await _controller.EditHearing(_validId, _requestWithEndpoints);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateDisplayNameForEndpointAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateEndpointRequest>()), Times.Exactly(3));
        }
        [Test]
        public async Task Should_remove_endpoint_if_endpoint_is_removed_from_the_endpoint_list()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>())).ReturnsAsync(_existingHearingWithEndpoints);
            var result = await _controller.EditHearing(_validId, _requestWithEndpoints);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveEndPointFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Once);
        }
        private void GivenApiThrowsExceptionOnUpdate(HttpStatusCode code)
        {
            _bookingsApiClient.Setup(x =>
                    x.UpdateHearingDetailsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingRequest>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(code));
        }
    }
}