using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UserAPI.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using AdminWebsite.Models;
using FluentValidation;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class CancelHearingTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IUserAccountService> _userAccountService;
        private Mock<IValidator<BookNewHearingRequest>> _bookNewHearingRequestValidator;
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private AdminWebsite.Controllers.HearingsController _controller;
        private Guid _guid;
        private UpdateBookingStatusRequest _updateBookingStatusRequest;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountService = new Mock<IUserAccountService>();
            _bookNewHearingRequestValidator = new Mock<IValidator<BookNewHearingRequest>>();
            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService.Object,
                _bookNewHearingRequestValidator.Object,
                _editHearingRequestValidator.Object,
                UrlEncoder.Default);
                
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
    }
}
