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

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class CancelHearingTests
    {
        private Mock<IUserApiClient> _userApiClient;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IUserAccountService> _userAccountService;
        private AdminWebsite.Controllers.HearingsController _controller;
        private HearingDetailsResponse _vhBookingToDelete;
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

            _vhBookingToDelete = new HearingDetailsResponse
            {
                Cases = new List<BookingsAPI.Client.CaseResponse>() { new BookingsAPI.Client.CaseResponse() { Name = "BBC vs ITV", Number = "TX/12345/2019", Is_lead_case = false } },
                Case_type_name = "Civil Money Claims",
                Created_by = "CaseAdministrator",
                Created_date = DateTime.UtcNow,
                Hearing_room_name = "Room 6.41D",
                Hearing_type_name = "Application to Set Judgment Aside",
                Hearing_venue_name = "Manchester Civil and Family Justice Centre",
                Id = _guid,
                Other_information = "Any other information about the hearing",
                Participants = new List<ParticipantResponse>()
                {
                    new ParticipantResponse() { Case_role_name = "Judge", Contact_email = "Judge.Lumb@hearings.reform.hmcts.net", Display_name = "Judge Lumb", First_name = "Judge", Hearing_role_name = "Judge", Last_name = "Lumb", Middle_names = string.Empty, Telephone_number = string.Empty, Title = "Judge", Username = "Judge.Lumb@hearings.reform.hmcts.net" },
                    new ParticipantResponse() { Case_role_name = "Claimant", Contact_email = "test.claimaint@emailaddress.net", Display_name = "Test Claimaint", First_name = "Test", Hearing_role_name = "Claimant LIP", Last_name = "Claimaint", Middle_names = string.Empty, Telephone_number = string.Empty, Title = "Mr", Username = "Test.Claimaint@hearings.reform.hmcts.net" },
                    new ParticipantResponse() { Case_role_name = "Defendant", Contact_email = "test.defendant@emailaddress.net", Display_name = "Test Defendant", First_name = "Test", Hearing_role_name = "Solicitor", Last_name = "Defendant", Middle_names = string.Empty, Telephone_number = string.Empty, Title = "Mr", Username = "Test.Defendant@hearings.reform.hmcts.net" },
                },
                Scheduled_date_time = DateTime.UtcNow.AddDays(10),
                Scheduled_duration = 60,
                Status = HearingDetailsResponseStatus.Booked,
                Updated_by = string.Empty,
                Updated_date = DateTime.UtcNow
            };
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_vhBookingToDelete);

            _updateBookingStatusRequest = new UpdateBookingStatusRequest() { Status = UpdateBookingStatusRequestStatus.Cancelled, Updated_by = "admin user" };
        }

        [Test]
        public async Task should_cancel_existing_hearing()
        {
            var result = await _controller.UpdateBookingStatus(_guid, _updateBookingStatusRequest);
            var noContentResult = (NoContentResult)result;
            noContentResult.StatusCode.Should().Be(204);
        }

        [Test]
        public async Task should_return_bad_request_if_hearing_id_is_empty()
        {
            GivenApiThrowsExceptionOnCancel(HttpStatusCode.BadRequest);

            var invalidId = Guid.NewGuid();
            var result = await _controller.UpdateBookingStatus(invalidId, _updateBookingStatusRequest);
            var badRequestResult = (BadRequestObjectResult)result;
            badRequestResult.StatusCode.Should().Be(400);
        }

        [Test]
        public async Task should_return_bad_request_if_invalid_hearing_id()
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
                .ThrowsAsync(new BookingsApiException(code.ToString(), (int)code, "",
                    new Dictionary<string, IEnumerable<string>>(), null));
        }
    }
}
