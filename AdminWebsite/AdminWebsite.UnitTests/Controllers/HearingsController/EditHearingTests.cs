using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UserAPI.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using Testing.Common;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class EditHearingTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IUserAccountService> _userAccountService;
        
        private Guid _validId;
        private EditHearingRequest _request;
        private HearingDetailsResponse _existingHearing;
        
        private AdminWebsite.Controllers.HearingsController _controller;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountService = new Mock<IUserAccountService>();
            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object, _userIdentity.Object, _userAccountService.Object);

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
            
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_existingHearing);
        }
        
        [Test]
        public async Task should_return_bad_request_if_invalid_hearing_id()
        {
            var invalidId = Guid.Empty;
            var result = await _controller.EditHearing(invalidId, _request);
            var badRequestResult = (BadRequestObjectResult) result.Result;
            var errors = (SerializableError) badRequestResult.Value;
            errors["hearingId"].Should().BeEquivalentTo(new []{"Please provide a valid hearingId"});
        }
        
        [Test]
        public async Task should_return_bad_request_if_case_is_not_given()
        {
            _request.Case = null;

            var result = await _controller.EditHearing(_validId, _request);
            var badRequestResult = (BadRequestObjectResult) result.Result;
            var errors = (SerializableError) badRequestResult.Value;
            errors["case"].Should().BeEquivalentTo(new []{"Please provide valid case details"});
        }
        
        [Test]
        public async Task should_return_bad_request_if_no_participants_are_given()
        {
            _request.Participants.Clear();
            var result = await _controller.EditHearing(_validId, _request);
            var badRequestResult = (BadRequestObjectResult) result.Result;
            var errors = (SerializableError) badRequestResult.Value;
            errors["participants"].Should().BeEquivalentTo(new []{"Please provide at least one participant"});
        }

        [Test]
        public async Task should_return_not_found_if_hearing_is_missing()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));

            var result = await _controller.EditHearing(_validId, _request);
            var notFoundResult = (NotFoundObjectResult) result.Result;
            notFoundResult.Value.Should().Be($"No hearing with id found [{_validId}]");
        }

        [Test]
        public async Task should_add_participants_without_id()
        {
            _request.Participants[0].FirstName = "New user firstname";
            
            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult) result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.AddParticipantsToHearingAsync(It.IsAny<Guid>(), It.IsAny<AddParticipantsToHearingRequest>()), Times.Once);
        }
        
        [Test]
        public async Task should_update_existing_participants()
        {
            _request.Participants[0].Id = _existingHearing.Participants[0].Id;
            
            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult) result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateParticipantRequest>()), Times.Once);
        }
        
        [Test]
        public async Task should_delete_missing_participants()
        {
            var removedUserId = _existingHearing.Participants[0].Id.Value;
            
            var result = await _controller.EditHearing(_validId, _request);
            ((OkObjectResult) result.Result).StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.RemoveParticipantFromHearingAsync(It.IsAny<Guid>(), removedUserId), Times.Once);
        }

        [Test]
        public async Task should_return_updated_hearing()
        {
            var result = await _controller.EditHearing(_validId, _request);
            var hearing = (HearingDetailsResponse) ((OkObjectResult) result.Result).Value;
            hearing.Id.Should().Be(_existingHearing.Id);
        }
        
        [Test]
        public async Task should_pass_on_bad_request_from_bookings_api()
        {
            GivenApiThrowsExceptionOnUpdate(HttpStatusCode.BadRequest);

            var response = await _controller.EditHearing(_validId, _request);
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }
        
        [Test]
        public async Task should_pass_on_not_found_request_from_bookings_api()
        {
            GivenApiThrowsExceptionOnUpdate(HttpStatusCode.NotFound);

            var response = await _controller.EditHearing(_validId, _request);
            response.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Test]
        public async Task should_replace_judge_based_on_email()
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

        private void GivenApiThrowsExceptionOnUpdate(HttpStatusCode code)
        {
            _bookingsApiClient.Setup(x =>
                    x.UpdateHearingDetailsAsync(It.IsAny<Guid>(), It.IsAny<UpdateHearingRequest>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(code));
        }
    }
}