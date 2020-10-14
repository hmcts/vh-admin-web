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
using FizzWare.NBuilder;
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
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private Mock<IVideoApiClient> _videoApiMock;
        private Mock<IPollyRetryService> _pollyRetryServiceMock;

        private Guid _validId;
        private EditHearingRequest _addNewParticipantRequest;
        private EditHearingRequest _addEndpointToHearingRequest;
        private HearingDetailsResponse _updatedExistingParticipantHearingOriginal;
        private HearingDetailsResponse _existingHearingWithEndpointsOriginal;

        private AdminWebsite.Controllers.HearingsController _controller;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountService = new Mock<IUserAccountService>();
            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();
            _videoApiMock = new Mock<IVideoApiClient>();
            _pollyRetryServiceMock = new Mock<IPollyRetryService>();

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService.Object,
                _editHearingRequestValidator.Object,
                JavaScriptEncoder.Default,
                _videoApiMock.Object,
                _pollyRetryServiceMock.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object);

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
                        ContactEmail = "new@user.com"
                    }
                }
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
                }
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
                Endpoints = new List<BookingsAPI.Client.EndpointResponse> 
                { 
                    new BookingsAPI.Client.EndpointResponse { Display_name = "data1", Id = guid1,  Pin= "0000", Sip = "1111111111" },
                    new BookingsAPI.Client.EndpointResponse { Display_name = "data2", Id = guid2,  Pin= "1111", Sip = "2222222222", Defence_advocate_id = Guid.NewGuid() },
                    new BookingsAPI.Client.EndpointResponse { Display_name = "data3", Id = guid3,  Pin= "2222", Sip = "5544332234" },
                    new BookingsAPI.Client.EndpointResponse { Display_name = "data4", Id = guid4,  Pin= "2222", Sip = "5544332234", Defence_advocate_id = Guid.NewGuid() },
                } 
            };
            
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal);
            
            _editHearingRequestValidator.Setup(x => x.Validate(It.IsAny<EditHearingRequest>())).Returns(new ValidationResult());
            _userAccountService
                .Setup(x => x.UpdateParticipantUsername(It.IsAny<AdminWebsite.BookingsAPI.Client.ParticipantRequest>()))
                .Callback<AdminWebsite.BookingsAPI.Client.ParticipantRequest>(p => p.Username = p.Contact_email)
                .ReturnsAsync(Guid.NewGuid().ToString());

        }
        
        [Test]
        public async Task Should_return_bad_request_if_invalid_hearing_id()
        {
            var invalidId = Guid.Empty;
            var result = await _controller.EditHearing(invalidId, _addNewParticipantRequest);
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
            
            _addNewParticipantRequest.Case = null;

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
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
            
            _addNewParticipantRequest.Participants.Clear();
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var badRequestResult = (BadRequestObjectResult) result.Result;
            var errors = (SerializableError) badRequestResult.Value;
            errors["participants"].Should().BeEquivalentTo(new []{"Please provide at least one participant"});
        }

        [Test]
        public async Task Should_return_not_found_if_hearing_is_missing()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var notFoundResult = (NotFoundObjectResult) result.Result;
            notFoundResult.Value.Should().Be($"No hearing with id found [{_validId}]");
        }

        [Test]
        public async Task Should_add_participants_without_id()
        {
            var updatedHearing = _updatedExistingParticipantHearingOriginal = new HearingDetailsResponse
                {Participants = _updatedExistingParticipantHearingOriginal.Participants};
            updatedHearing.Participants[0].First_name = "New user firstname";
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com"
            });
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);
            
            _addNewParticipantRequest.Participants[0].FirstName = "New user firstname";
            
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult) result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Once);
        }
        
        [Test]
        public async Task Should_update_existing_participants()
        {
            _addNewParticipantRequest.Participants[0].Id = _updatedExistingParticipantHearingOriginal.Participants[0].Id;
            
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult) result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateParticipantRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_not_update_existing_participants_if_participnt_not_found_in_hearing()
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
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(),  It.IsAny<AddParticipantsToHearingRequest>()), Times.Once);
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
        }
        [Test]
        public async Task Should_not_add_judge_if_one_record_for_judge_exists_in_database()
        {
            _addNewParticipantRequest.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _updatedExistingParticipantHearingOriginal.Participants.ForEach(x => x.Username = "existing@judge.com");

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Never);
        }

        [Test]
        public async Task Should_add_judge_if_participants_list_of_the_hearing_null()
        {
            _addNewParticipantRequest.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _updatedExistingParticipantHearingOriginal.Participants = null;

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_add_judge_if_no_any_participants_in_the_list_for_the_hearing()
        {
            _addNewParticipantRequest.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _updatedExistingParticipantHearingOriginal.Participants = new List<ParticipantResponse>();

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Once);
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
                Username = "new@user.com"
            });
            var judge = newPats.First(x => x.Case_role_name == "Judge");
            
            judge.Case_role_name = "Judge";
            judge.First_name = "New";
            judge.Last_name = "Judge";
            judge.Contact_email = newJudgeEmail;
            
            var updatedHearing = new HearingDetailsResponse
                {Participants = _updatedExistingParticipantHearingOriginal.Participants};
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com"
            });
            updatedHearing.Participants[judgeIndex] = judge;
            
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);
            
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateParticipantRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_delete_missing_participants()
        {
            var removedUserId = _updatedExistingParticipantHearingOriginal.Participants[0].Id;
            var updatedPatList = _updatedExistingParticipantHearingOriginal.Participants
                .Where(x => x.Id != removedUserId).ToList();
            var updatedHearing = new HearingDetailsResponse
                {Participants = updatedPatList};
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com"
            });
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);
            
            
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult) result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), removedUserId), Times.Once);
        }

        [Test]
        public async Task Should_not_delete_missing_participant_if_no_any_participants_in_the_list_for_the_hearing()
        {
            _updatedExistingParticipantHearingOriginal.Participants = new List<ParticipantResponse>();
            var updatedHearing = new HearingDetailsResponse
                {Participants = _updatedExistingParticipantHearingOriginal.Participants};
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com"
            });
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Never);
        }
        [Test]
        public async Task Should_delete_missing_participant_from_hearing_if_no_any_participants_in_the_request()
        {
            _addNewParticipantRequest.Participants = new List<EditParticipantRequest>();

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Once);
        }
        [Test]
        public async Task Should_not_delete_missing_participant_if_no_any_participants()
        {
            _updatedExistingParticipantHearingOriginal.Participants = new List<ParticipantResponse>();
            _addNewParticipantRequest.Participants = new List<EditParticipantRequest>();
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Never);
        }

        [Test]
        public async Task Should_delete_two_missing_participant_if_two_with_no_matching_contact_email_exist_for_the_hearing()
        {
            _addNewParticipantRequest.Participants.ForEach(x => { x.ContactEmail = "existing@judge.com"; x.CaseRoleName = "Judge"; });
            _updatedExistingParticipantHearingOriginal.Participants.ForEach(x => x.Contact_email= "old@judge.com");
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
        }

        [Test]
        public async Task Should_not_delete_missing_participant_if_all_match_contact_email_for_updated_hearing()
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

            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            ((OkObjectResult)result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Never);
        }

        [Test]
        public async Task Should_return_updated_hearing()
        {
            var updatedHearing = new HearingDetailsResponse
                {Participants = _updatedExistingParticipantHearingOriginal.Participants};
            updatedHearing.Participants.Add(new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "new@user.com",
                Username = "new@user.com"
            });
            
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);
            var result = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            var hearing = (HearingDetailsResponse) ((OkObjectResult) result.Result).Value;
            hearing.Id.Should().Be(_updatedExistingParticipantHearingOriginal.Id);
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
                Username = "new@user.com"
            });
            newPats.Add(new ParticipantResponse
            {
                Case_role_name = "Judge",
                First_name = "New",
                Last_name = "Judge",
                Contact_email = newJudgeEmail,
                Username = newJudgeEmail
            });
            var updatedHearing = new HearingDetailsResponse
                {Participants = newPats};
            
            _bookingsApiClient.SetupSequence(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_updatedExistingParticipantHearingOriginal)
                .ReturnsAsync(updatedHearing);

            var response = await _controller.EditHearing(_validId, _addNewParticipantRequest);
            response.Result.Should().BeOfType<OkObjectResult>();

            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(_validId, existingJudgeId), Times.Once);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(_validId, It.Is<AddParticipantsToHearingRequest>(
                participants => participants.Participants.Any(p => p.Username == newJudgeEmail))), Times.Once);
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
        }
        private void GivenApiThrowsExceptionOnUpdate(HttpStatusCode code)
        {
            _bookingsApiClient.Setup(x =>
                    x.UpdateHearingDetailsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingRequest>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(code));
        }

        private void SetupUpdatedHearingResponse()
        {
            // setup response
            var pat1 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Representative").Build();
            var pat2 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Individual").Build();
            var hearingDetailsResponse = Builder<HearingDetailsResponse>.CreateNew()
                .With(x=> x.Participants = new List<ParticipantResponse> {pat1, pat2}).Build();
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);
        }
    }
}