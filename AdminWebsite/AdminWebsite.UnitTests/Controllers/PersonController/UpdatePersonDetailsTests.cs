using System;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using UserApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.PersonController
{
    public class UpdatePersonDetailsTests
    {
        private AdminWebsite.Controllers.PersonsController _controller;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserAccountService> _userAccountService;

        private Guid _personId;
        private Guid _adUserId;
        private UpdateAccountDetailsRequest _payload;
        private UserResponse _updatedUserResponse;

        [SetUp]
        public void Setup()
        {
            InitVariables();
            SetupMocks();
            
            var testSettings = new TestUserSecrets
            {
                TestUsernameStem = "@madeUpEmail.com"
            };
            
            _controller = new AdminWebsite.Controllers.PersonsController(_bookingsApiClient.Object,
                JavaScriptEncoder.Default, Options.Create(testSettings), _userAccountService.Object);
        }

        private void InitVariables()
        {
            _personId = Guid.NewGuid();
            _adUserId = Guid.NewGuid();
            _payload = new UpdateAccountDetailsRequest
            {
                FirstName = "New",
                LastName = "Me",
                CurrentUsername = "old.me@test.com"
            };

            _updatedUserResponse = new UserResponse
            {
                Email = "new.me@test.com",
                DisplayName = "New Me",
                FirstName = "New",
                LastName = "Me"
            };
        }

        private void SetupMocks()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userAccountService = new Mock<IUserAccountService>();
            
            _userAccountService
                .Setup(x => x.GetAdUserIdForUsername(_payload.CurrentUsername))
                .ReturnsAsync(_adUserId.ToString());
            
            _userAccountService
                .Setup(x => x.UpdateUserAccountDetails(_adUserId,_payload.FirstName, _payload.LastName))
                .ReturnsAsync(_updatedUserResponse);
        }

        [Test]
        public async Task should_return_accepted_when_person_is_updated_successfully()
        {
            var actionResult = await _controller.UpdatePersonDetails(_personId, _payload);
            
            actionResult.Result.Should().BeOfType<AcceptedResult>();
            var result = (AcceptedResult) actionResult.Result;
            result.StatusCode.Should().Be((int) HttpStatusCode.Accepted);
        }
        
        [Test]
        public async Task should_return_status_code_from_user_api_exception()
        {
            _userAccountService
                .Setup(x => x.GetAdUserIdForUsername(_payload.CurrentUsername))
                .Throws(ClientException.ForUserService(HttpStatusCode.NotFound));

            var actionResult = await _controller.UpdatePersonDetails(_personId, _payload);
            
            actionResult.Result.Should().BeOfType<ObjectResult>();
            var result = (ObjectResult) actionResult.Result;
            result.StatusCode.Should().Be((int) HttpStatusCode.NotFound);
        }

        [Test]
        public async Task should_return_status_code_from_bookings_api_exception()
        {
            _bookingsApiClient
                .Setup(x => x.UpdatePersonDetailsAsync(_personId, It.IsAny<UpdatePersonDetailsRequest>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));

            var actionResult = await _controller.UpdatePersonDetails(_personId, _payload);
            
            actionResult.Result.Should().BeOfType<ObjectResult>();
            var result = (ObjectResult) actionResult.Result;
            result.StatusCode.Should().Be((int) HttpStatusCode.NotFound);
        }
    }
}