using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UserAPI.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Testing.Common;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class CancelHearingTests
    {
        private Mock<IUserApiClient> _userApiClient;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IUserAccountService> _userAccountService;
        private AdminWebsite.Controllers.HearingsController _controller;
        private Guid _guid;
        private UpdateBookingStatusRequest _updateBookingStatusRequest;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userApiClient = new Mock<IUserApiClient>();
            _userApiClient = new Mock<IUserApiClient>();
            _userAccountService = new Mock<IUserAccountService>();
            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object, 
                _userIdentity.Object, _userAccountService.Object);
            _guid = Guid.NewGuid();

            _updateBookingStatusRequest = new UpdateBookingStatusRequest() { Status = UpdateBookingStatusRequestStatus.Cancelled, Updated_by = "admin user" };
        }

        [Test]
        public async Task should_update_status_of_hearing_to_cancelled_given_status_and_updatedby()
        {
            var result = await _controller.UpdateBookingStatus(_guid, _updateBookingStatusRequest);
            var noContentResult = (NoContentResult)result;
            noContentResult.StatusCode.Should().Be(204);
        }

        [Test]
        public async Task should_return_bad_request_if_status_is_not_sent()
        {
            GivenApiThrowsExceptionOnCancel(HttpStatusCode.BadRequest);

            _updateBookingStatusRequest.Status = null;
            var result = await _controller.UpdateBookingStatus(_guid, _updateBookingStatusRequest);
            var badRequestResult = (BadRequestObjectResult)result;
            badRequestResult.StatusCode.Should().Be(400);
        }

        [Test]
        public async Task should_return_not_found_if_invalid_hearing_id()
        {
            GivenApiThrowsExceptionOnCancel(HttpStatusCode.NotFound);

            var result = await _controller.UpdateBookingStatus(_guid, _updateBookingStatusRequest);
            var notFoundResult = (NotFoundObjectResult) result;
            notFoundResult.StatusCode.Should().Be(404);
        }

        private void GivenApiThrowsExceptionOnCancel(HttpStatusCode code)
        {
            _bookingsApiClient.Setup(x =>
                    x.UpdateBookingStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateBookingStatusRequest>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(code));
        }
    }
}
