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
using Testing.Common;

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

            await PostWithParticipants(participant);
            
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
            
            await PostWithParticipants(participant);
            
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
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var result = await _controller.Post(hearing);
            result.Result.Should().BeOfType<BadRequestObjectResult>();   
        }

        [Test]
        public async Task should_pass_current_user_as_created_by_to_service()
        {
            
            const string currentUsername = "test@user.com";
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns(currentUsername);

            await PostNewHearing();

            _bookingsApiClient.Verify(x => x.BookNewHearingAsync(It.Is<BookNewHearingRequest>(
                request => request.Created_by == currentUsername)), Times.Once);
        }

        private Task<ActionResult<HearingDetailsResponse>> PostNewHearing()
        {
            // without supplying participants
            return PostWithParticipants();
        }

        private async Task<ActionResult<HearingDetailsResponse>> PostWithParticipants(
            params BookingsAPI.Client.ParticipantRequest[] participants)
        {
            var hearing = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>(participants)
            };

            return await _controller.Post(hearing);
        }
    }
}