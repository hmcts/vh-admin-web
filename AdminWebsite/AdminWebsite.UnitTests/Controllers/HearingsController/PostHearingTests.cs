using System.Collections.Generic;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Security;
using AdminWebsite.Services;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
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
        private Mock<IValidator<BookNewHearingRequest>> _bookNewHearingRequestValidator;

        private AdminWebsite.Controllers.HearingsController _controller;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountService = new Mock<IUserAccountService>();
            _bookNewHearingRequestValidator = new Mock<IValidator<BookNewHearingRequest>>();

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object, _userIdentity.Object, _userAccountService.Object, _bookNewHearingRequestValidator.Object, UrlEncoder.Default);
        }

        [Test]
        public async Task should_update_participant_user_details()
        {
            _bookNewHearingRequestValidator.Setup(x => x.Validate(It.IsAny<BookNewHearingRequest>())).Returns(new ValidationResult());

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
            _bookNewHearingRequestValidator.Setup(x => x.Validate(It.IsAny<BookNewHearingRequest>())).Returns(new ValidationResult());

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
            _bookNewHearingRequestValidator.Setup(x => x.Validate(It.IsAny<BookNewHearingRequest>())).Returns(new ValidationResult());

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
            _bookNewHearingRequestValidator.Setup(x => x.Validate(It.IsAny<BookNewHearingRequest>())).Returns(new ValidationResult());

            const string currentUsername = "test@user.com";
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns(currentUsername);

            await PostNewHearing();

            _bookingsApiClient.Verify(x => x.BookNewHearingAsync(It.Is<BookNewHearingRequest>(
                request => request.Created_by == currentUsername)), Times.Once);
        }

        [Test]
        public async Task should_return_bad_request_on_validation_failure()
        {
            _bookNewHearingRequestValidator.Setup(x => x.Validate(It.IsAny<BookNewHearingRequest>())).Returns(new ValidationResult(new []{ new ValidationFailure("dsfs", "asda", new object()) }));

            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = "username",
                Case_role_name = "Claimant",
                Hearing_role_name = "Solicitor"
            };

            var response = await PostWithParticipants(participant);
            response.Result.Should().BeOfType<BadRequestObjectResult>();

            _userAccountService.Verify(x => x.UpdateParticipantUsername(participant), Times.Never);
        }

        private Task<ActionResult<HearingDetailsResponse>> PostNewHearing()
        {
            // without supplying participants
            return PostWithParticipants();
        }

        private async Task<ActionResult<HearingDetailsResponse>> PostWithParticipants(params BookingsAPI.Client.ParticipantRequest[] participants)
        {
            var hearing = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>(participants)
            };

            return await _controller.Post(hearing);
        }
    }
}