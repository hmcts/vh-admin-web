using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace AdminWebsite.UnitTests.Controllers
{
    public class JudiciaryAccountsControllerTest
    {
        private AdminWebsite.Controllers.JudiciaryAccountsController _controller;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserAccountService> _userAccountService;
        private List<PersonResponse> _judiciaryResponse;


        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userAccountService = new Mock<IUserAccountService>();
            var testSettings = new TestUserSecrets
            {
                TestUsernameStem = "@hmcts.net"
            };

            _controller = new AdminWebsite.Controllers.JudiciaryAccountsController(_userAccountService.Object,
                JavaScriptEncoder.Default, _bookingsApiClient.Object, Options.Create(testSettings));

            _judiciaryResponse = new List<PersonResponse>
            {
                new PersonResponse
                {
                  Id = Guid.NewGuid(),
                  Contact_email = "",
                  First_name = "Adam",
                  Last_name = "Mann",
                  Telephone_number ="",
                  Title = "Ms",
                  Middle_names = "No",
                  Username = "adoman@hmcts.net"
                }
            };
        }

        [Test]
        public async Task Should_return_request_if_match_to_search_term()
        {
            _judiciaryResponse.Add(new PersonResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "",
                First_name = "Jack",
                Last_name = "Mann",
                Telephone_number = "",
                Title = "Mr",
                Middle_names = "No",
                Username = "jackman@judiciary.net"
            });
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                              .ReturnsAsync(_judiciaryResponse);

            var searchTerm = "ado";
            var result = await _controller.PostJudiciaryPersonBySearchTermAsync(searchTerm);

            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
            var personRespList = (List<PersonResponse>)okRequestResult.Value;
            personRespList.Count.Should().Be(1);
            personRespList[0].Username.Should().Be(_judiciaryResponse[1].Username);
        }

        [Test]
        public async Task Should_pass_on_bad_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var response = await _controller.PostJudiciaryPersonBySearchTermAsync("term");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public void Should_pass_on_exception_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            Assert.ThrowsAsync<BookingsApiException>(() => _controller.PostJudiciaryPersonBySearchTermAsync("term"));
        }

        [Test]
        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public async Task Should_return_judiciary_and_courtroom_accounts_if_match_to_search_term(bool withJudiciary, bool withCourtroom)
        {
            _judiciaryResponse.Add(new PersonResponse
            {
                Id = Guid.NewGuid(),
                Contact_email = "",
                First_name = "Jack",
                Last_name = "Mann",
                Telephone_number = "",
                Title = "Mr",
                Middle_names = "No",
                Username = "jackman@judiciary.net"
            });
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                              .ReturnsAsync(withJudiciary ? _judiciaryResponse : new List<PersonResponse>());

            var _courtRoomResponse = new List<JudgeResponse>
                {
                    new JudgeResponse
                    {
                        FirstName = "Sam",
                        LastName = "Smith",
                        Email = "judge.sam@judiciary.net"
                    }
                };

            _userAccountService.Setup(x => x.SearchJudgesByEmail(It.IsAny<string>()))
                .ReturnsAsync(withCourtroom ? _courtRoomResponse : new List<JudgeResponse>());


            var searchTerm = "judici";
            var result = await _controller.PostJudgesBySearchTermAsync(searchTerm);

            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
            var personRespList = (List<JudgeResponse>)okRequestResult.Value;

            var expectedJudiciaryCount = withJudiciary ? _judiciaryResponse.Count : 0;
            var expectedCourtRoomCount = withCourtroom ? _courtRoomResponse.Count : 0;

            var expectedTotal = expectedJudiciaryCount + expectedCourtRoomCount;

            personRespList.Count.Should().Be(expectedTotal);
        }

        [Test]
        public async Task Should_pass_on_bad_request_from_bookings_api_for_judge_accounts()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));
           
            var response = await _controller.PostJudgesBySearchTermAsync("term");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public void Should_pass_on_exception_request_from_bookings_api_for_judges_accounts()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            Assert.ThrowsAsync<BookingsApiException>(() => _controller.PostJudgesBySearchTermAsync("term"));
        }
    }
}