using AdminWebsite.Contracts.Responses;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Responses;
using UserApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers
{
    public class JudiciaryAccountsControllerTest
    {
        private AdminWebsite.Controllers.JudiciaryAccountsController _controller;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserAccountService> _userAccountService;
        private List<JudiciaryPersonResponse> _judiciaryResponse;
        
        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _controller = new AdminWebsite.Controllers.JudiciaryAccountsController(
                _userAccountService.Object,
                JavaScriptEncoder.Default,
                _bookingsApiClient.Object);

            _judiciaryResponse = new List<JudiciaryPersonResponse>
            {
                new()
                {
                    FirstName = "Adam",
                    LastName = "Mann",
                    Title = "Ms",
                    Email = "adoman@hmcts.net"
                }
            };
        }

        [Test]
        public async Task Should_return_request_if_match_to_search_term()
        {
            _judiciaryResponse = new List<JudiciaryPersonResponse>
            {
                new()
                {
                    FirstName = "Jack",
                    LastName = "Mann",
                    Title = "Mr",
                    Email = "jackman@judiciary.net"
                }
            };
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                              .ReturnsAsync(_judiciaryResponse);

            var searchTerm = "ado";
            var result = await _controller.SearchForJudiciaryPersonAsync(searchTerm);

            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
            var personRespList = (List<JudiciaryPerson>)okRequestResult.Value;
            personRespList.Count.Should().Be(1);
            personRespList[0].Email.Should().Be(_judiciaryResponse[0].Email);
        }

        [Test]
        public async Task Should_pass_on_bad_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var response = await _controller.SearchForJudiciaryPersonAsync("term");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public void Should_pass_on_exception_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            Assert.ThrowsAsync<BookingsApiException>(() => _controller.SearchForJudiciaryPersonAsync("term"));
        }
        
        [Test]
        public async Task Should_return_judiciary_person_list_by_email_search_term()
        {
            // Arrange
            var term = "test";
            var encodedTerm = JavaScriptEncoder.Default.Encode(term);
            var expectedJudiciaryPersonResponse = new List<JudiciaryPersonResponse>
            {
                new JudiciaryPersonResponse
                {
                    FirstName = "John",
                    LastName = "Doe",
                    Email = "johndoe@hmcts.net"
                }
            };
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(expectedJudiciaryPersonResponse);
            _controller = new AdminWebsite.Controllers.JudiciaryAccountsController(_userAccountService.Object, JavaScriptEncoder.Default, _bookingsApiClient.Object);

            // Act
            var result = await _controller.SearchForJudiciaryPersonAsync(term);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
            var personRespList = (List<JudiciaryPerson>)okRequestResult.Value;
            personRespList.Count.Should().Be(1);
            personRespList[0].Email.Should().Be(expectedJudiciaryPersonResponse[0].Email);
            _bookingsApiClient.Verify(x => x.PostJudiciaryPersonBySearchTermAsync(It.Is<SearchTermRequest>(y => y.Term == encodedTerm)), Times.Once);
        }
        
        [Test]
        public async Task PostJudgesBySearchTerm_should_return_courtroom_accounts_if_match_to_search_term()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                              .ReturnsAsync(new List<JudiciaryPersonResponse>());

            var _courtRoomResponse = new List<JudgeResponse>
            {
                new JudgeResponse
                {
                    FirstName = "FirstName1",
                    LastName = "FirstName2",
                    Email = "judge.1@hmcts.net",
                    ContactEmail = "judge1@personal.com"
                },
                new JudgeResponse
                {
                    FirstName = "FirstName3",
                    LastName = "LastName3",
                    Email = "judge.3@hmcts.net",
                    ContactEmail = "judge3@personal.com"
                },
                new JudgeResponse
                {
                    FirstName = "FirstName2",
                    LastName = "LastName2",
                    Email = "judge.2@hmcts.net", // Out of order to test order
                    ContactEmail = "judge2@personal.com"
                }
            };

            _userAccountService.Setup(x => x.SearchJudgesByEmail(It.IsAny<string>())).ReturnsAsync(_courtRoomResponse);

            var searchTerm = "jud";
            var result = await _controller.PostJudgesBySearchTermAsync(searchTerm);

            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
            var personRespList = (List<JudgeResponse>)okRequestResult.Value;

            var expectedResponse = new List<JudgeResponse>();
            var expectedCourtRoomResponses = new List<JudgeResponse>();
            
            expectedCourtRoomResponses = _courtRoomResponse.ToList();
            expectedResponse.AddRange(_courtRoomResponse);
            personRespList.Count.Should().Be(expectedCourtRoomResponses.Count);
   
            Assert.That(personRespList, Is.EquivalentTo(_courtRoomResponse));
            Assert.That(personRespList, Is.Not.EqualTo(_courtRoomResponse));
            Assert.That(personRespList, Is.EqualTo(_courtRoomResponse.OrderBy(x => x.Email)));

            personRespList.Should().BeEquivalentTo(expectedResponse);
        }
    }
}