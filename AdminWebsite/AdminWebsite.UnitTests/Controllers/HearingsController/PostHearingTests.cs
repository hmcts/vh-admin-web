using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Security;
using AdminWebsite.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class PostHearingTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IUserAccountService> _userAccountService;
        
        private AdminWebsite.Controllers.HearingsController _controller;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountService = new Mock<IUserAccountService>();
            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object, _userIdentity.Object, _userAccountService.Object);
        }

        [Test]
        public async Task should_update_participant_user_details()
        {
            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = "username",
                Case_role_name= "Claimant",
                Hearing_role_name = "Solicitor"
            };
            
            var hearing = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest> { participant }
            };

            await _controller.Post(hearing);
            
            _userAccountService.Verify(x => x.UpdateParticipantUsername(participant), Times.Once);
        }
        
        [Test]
        public async Task should_not_update_user_details_for_judge()
        {
            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = "username",
                Case_role_name= "Judge",
                Hearing_role_name = "Judge"
            };
            
            var hearing = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest> { participant }
            };

            await _controller.Post(hearing);
            
            _userAccountService.Verify(x => x.UpdateParticipantUsername(participant), Times.Never);   
        }
        
        [Test]
        public async Task should_pass_bad_request_from_bookings_api()
        {
            var hearing = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>()
            };

            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .Throws(new BookingsApiException("BadRequest", (int) HttpStatusCode.BadRequest,
                    "", new Dictionary<string, IEnumerable<string>>(), null));

            var result = await _controller.Post(hearing);
            result.Result.Should().BeOfType<BadRequestObjectResult>();   
        }

        [Test]
        public async Task should_pass_current_user_as_created_by_to_service()
        {
            var hearing = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>()
            };

            const string currentUsername = "test@user.com";
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns(currentUsername);

            await _controller.Post(hearing);

            _bookingsApiClient.Verify(x => x.BookNewHearingAsync(It.Is<BookNewHearingRequest>(
                request => request.Created_by == currentUsername)), Times.Once);
        }
    }
}