using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.UserAPI.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class EditHearingTests
    {
        private Mock<IUserApiClient> _userApiClient;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private AdminWebsite.Controllers.HearingsController _controller;
        private Guid _validId;
        private EditHearingRequest _request;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userApiClient = new Mock<IUserApiClient>();
            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object, _userIdentity.Object, _userApiClient.Object);

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
                    new EditParticipantRequest()
                } 
            };
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
                .Throws(new BookingsApiException("Missing", 404, "", new Dictionary<string, IEnumerable<string>>(),
                    null));

            var result = await _controller.EditHearing(_validId, _request);
            var notFoundResult = (NotFoundObjectResult) result.Result;
            notFoundResult.Value.Should().Be($"No hearing with id found [{_validId}]");
        }
    }
}