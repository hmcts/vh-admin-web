using AdminWebsite.BookingsAPI.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Text.Encodings.Web;
using AdminWebsite.UnitTests.Helper;
using AdminWebsite.Configuration;
using AdminWebsite.Services;
using FizzWare.NBuilder;
using Microsoft.Extensions.Options;

namespace AdminWebsite.UnitTests.Controllers
{

    public class PersonsControllerTest
    {
        private AdminWebsite.Controllers.PersonsController _controller;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserAccountService> _userAccountService;
        private List<PersonResponse> _response;

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

            _response = new List<PersonResponse>
            {
                new PersonResponse
                {
                  Id = Guid.NewGuid(),
                  Contact_email = "adoman@test.net",
                  First_name = "Adam",
                  Last_name = "Mann",
                  Telephone_number ="111222333",
                  Title = "Ms",
                  Middle_names = "No",
                  Username = "adoman@test.net"
                }
            };
        }

        [Test]
        public async Task Should_return_request_if_match_to_search_term()
        {
            _bookingsApiClient.Setup(x => x.PostPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                              .ReturnsAsync(_response);

            var searchTerm = "ado";
            var result = await _controller.PostPersonBySearchTerm(searchTerm);

            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
        }

        [Test]
        public async Task Should_pass_on_bad_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.PostPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var response = await _controller.PostPersonBySearchTerm("term");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public void Should_pass_on_exception_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.PostPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            Assert.ThrowsAsync<BookingsApiException>(() => _controller.PostPersonBySearchTerm("term"));
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
