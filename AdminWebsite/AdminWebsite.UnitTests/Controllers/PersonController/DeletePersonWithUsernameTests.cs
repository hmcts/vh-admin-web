using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Configuration;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers.PersonController
{
    public class DeletePersonWithUsernameTests
    {
        private AdminWebsite.Controllers.PersonsController _controller;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserAccountService> _userAccountService;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userAccountService = new Mock<IUserAccountService>();
            var testSettings = new TestUserSecrets
            {
                TestUsernameStem = "@madeUpEmail.com"
            };

            _controller = new AdminWebsite.Controllers.PersonsController(_bookingsApiClient.Object,
                JavaScriptEncoder.Default, Options.Create(testSettings), _userAccountService.Object);
        }
        
        [Test]
        public async Task Should_return_ok_with_list_of_hearings_for_username()
        {
            var responseMock = Builder<HearingsByUsernameForDeletionResponse>.CreateListOfSize(3).All()
                .With(x => x.Hearing_id = Guid.NewGuid()).Build().ToList();
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(It.IsAny<string>()))
                .ReturnsAsync(responseMock);
            
            var result = await _controller.GetHearingsByUsernameForDeletionAsync("realusername@test.com");

            var okResult = (OkObjectResult) result.Result;
            okResult.Should().NotBeNull();
            okResult.Value.Should().Be(responseMock);
        }

        [Test]
        public async Task Should_return_not_found_when_bookings_api_returns_not_found()
        {
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(It.IsAny<string>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));
            var result = await _controller.GetHearingsByUsernameForDeletionAsync("does_not_exist@test.com");
            var notFoundResult = (NotFoundResult) result.Result;
            notFoundResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task Should_return_ok_when_bookings_api_returns_not_found_but_account_exist_in_ad()
        {
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(It.IsAny<string>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));
            _userAccountService.Setup(x => x.GetAdUserIdForUsername(It.IsAny<string>()))
                .ReturnsAsync(Guid.NewGuid().ToString);
            var result = await _controller.GetHearingsByUsernameForDeletionAsync("onlyinad@test.com");
            var okResult = (OkObjectResult) result.Result;
            okResult.Should().NotBeNull();

            okResult.Value.As<List<HearingsByUsernameForDeletionResponse>>().Should().BeEmpty();
        }
        
        [Test]
        public async Task Should_return_unauthorised_when_bookings_api_returns_unauthorised()
        {
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(It.IsAny<string>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.Unauthorized));
            var result = await _controller.GetHearingsByUsernameForDeletionAsync("invalid_user@test.com");
            var notFoundResult = (UnauthorizedResult) result.Result;
            notFoundResult.Should().NotBeNull();
        }
        
        [Test]
        public void Should_pass_on_exception_when_getting_hearings_by_username_for_deletion_fails()
        {
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(It.IsAny<string>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            Assert.ThrowsAsync<BookingsApiException>(() =>
                _controller.GetHearingsByUsernameForDeletionAsync("usernamefailed@test.com"));
        }

        [Test]
        public async Task should_clean_username_before_removing_account()
        {
            var username = " Test.Hello@WORLD.COM  ";
            var usernameCleaned = username.Trim().ToLower();

            await _controller.DeletePersonWithUsernameAsync(username);
            _userAccountService.Verify(x => x.DeleteParticipantAccountAsync(usernameCleaned), Times.Once);
        }
    }
}