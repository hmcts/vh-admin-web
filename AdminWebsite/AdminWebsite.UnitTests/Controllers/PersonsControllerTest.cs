using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using System.Text.Encodings.Web;
using AdminWebsite.UnitTests.Helper;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Services;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
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
                TestUsernameStem = "@hmcts.net1"
            };

            _controller = new AdminWebsite.Controllers.PersonsController(_bookingsApiClient.Object,
                JavaScriptEncoder.Default, Options.Create(testSettings), _userAccountService.Object);

            _response = new List<PersonResponse>
            {
                new PersonResponse
                {
                  Id = Guid.NewGuid(),
                  ContactEmail = "adoman@hmcts.net",
                  FirstName = "Adam",
                  LastName = "Mann",
                  TelephoneNumber ="111222333",
                  Title = "Ms",
                  MiddleNames = "No",
                  Username = "adoman@hmcts.net"
                }
            };
        }

        [Test]
        public async Task Should_return_searched_participants()
        {
            // Arrange
            var additionalParticipantToReturn = new PersonResponse
            {
                Id = Guid.NewGuid(),
                ContactEmail = "jackfilter@hmcts.net",
                FirstName = "Filter",
                LastName = "Participant",
                TelephoneNumber = "111222333",
                Title = "Mr",
                MiddleNames = "No",
                Username = "jackfilter@hmcts.net"
            };
            _response.Add(additionalParticipantToReturn);
            
            var expectedResponse = new List<PersonResponse>();
            expectedResponse.Add(_response[0]);
            expectedResponse.Add(additionalParticipantToReturn);
            
            _bookingsApiClient.Setup(x => x.PostPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(_response);

            _userAccountService.Setup(x => x.GetJudgeUsers()).ReturnsAsync(new List<JudgeResponse>());

            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(new List<PersonResponse>());
            
            var searchTerm = "ado";

            // Act
            var result = await _controller.PostPersonBySearchTerm(searchTerm);

            // Assert
            var okObjectResult = result.Result.Should().BeAssignableTo<OkObjectResult>().Which;
            okObjectResult.Value.Should().BeEquivalentTo(expectedResponse);
            _bookingsApiClient.Verify(x => x.PostPersonBySearchTermAsync(It.Is<SearchTermRequest>(request => request.Term == searchTerm)), Times.Once);
            _bookingsApiClient.Verify(x => x.PostJudiciaryPersonBySearchTermAsync(It.Is<SearchTermRequest>(request => request.Term == searchTerm)), Times.Once);
            _userAccountService.Verify(x => x.GetJudgeUsers(), Times.Once);
        }
        
        [Test]
        public async Task Should_filter_judge_participants()
        {
            // Arrange
            var participantToFilter = new PersonResponse
            {
                Id = Guid.NewGuid(),
                ContactEmail = "jackfilter@hmcts.net",
                FirstName = "Filter",
                LastName = "Participant",
                TelephoneNumber = "111222333",
                Title = "Mr",
                MiddleNames = "No",
                Username = "jackfilter@hmcts.net"
            };
            _response.Add(participantToFilter);
            
            var expectedResponse = new List<PersonResponse>();
            expectedResponse.Add(_response[0]);
            
            _bookingsApiClient.Setup(x => x.PostPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(_response);

            _userAccountService.Setup(x => x.GetJudgeUsers()).ReturnsAsync(new[]
            {
                new JudgeResponse()
                {
                    Email = participantToFilter.ContactEmail
                }
            });

            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(new List<PersonResponse>());

            var searchTerm = "ado";
            // Act
            var result = await _controller.PostPersonBySearchTerm(searchTerm);

            // Assert
            var okObjectResult = result.Result.Should().BeAssignableTo<OkObjectResult>().Which;
            okObjectResult.Value.Should().BeEquivalentTo(expectedResponse);
            _bookingsApiClient.Verify(x => x.PostPersonBySearchTermAsync(It.Is<SearchTermRequest>(request => request.Term == searchTerm)), Times.Once);
            _bookingsApiClient.Verify(x => x.PostJudiciaryPersonBySearchTermAsync(It.Is<SearchTermRequest>(request => request.Term == searchTerm)), Times.Once);
            _userAccountService.Verify(x => x.GetJudgeUsers(), Times.Once);
        }

        [Test]
        public async Task Should_filter_judiciary_participants()
        {
            // Arrange
            var participantToFilter = new PersonResponse
            {
                Id = Guid.NewGuid(),
                ContactEmail = "jackfilter@hmcts.net",
                FirstName = "Filter",
                LastName = "Participant",
                TelephoneNumber = "111222333",
                Title = "Mr",
                MiddleNames = "No",
                Username = "jackfilter@hmcts.net"
            };
            _response.Add(participantToFilter);
            
            var expectedResponse = new List<PersonResponse>();
            expectedResponse.Add(_response[0]);
            
            _bookingsApiClient.Setup(x => x.PostPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(_response);

            _userAccountService.Setup(x => x.GetJudgeUsers()).ReturnsAsync(new List<JudgeResponse>());

            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(new[] {participantToFilter});
            
            var searchTerm = "ado";

            // Act
            var result = await _controller.PostPersonBySearchTerm(searchTerm);

            // Assert
            var okObjectResult = result.Result.Should().BeAssignableTo<OkObjectResult>().Which;
            okObjectResult.Value.Should().BeEquivalentTo(expectedResponse);
            _bookingsApiClient.Verify(x => x.PostPersonBySearchTermAsync(It.Is<SearchTermRequest>(request => request.Term == searchTerm)), Times.Once);
            _bookingsApiClient.Verify(x => x.PostJudiciaryPersonBySearchTermAsync(It.Is<SearchTermRequest>(request => request.Term == searchTerm)), Times.Once);
            _userAccountService.Verify(x => x.GetJudgeUsers(), Times.Once);
        }
        
        [Test]
        public async Task Should_filter_TestUsernameStem()
        {
            // Arrange
            var participantToFilter = new PersonResponse
            {
                Id = Guid.NewGuid(),
                ContactEmail = "jackfilter@hmcts.net1",
                FirstName = "Filter",
                LastName = "Participant",
                TelephoneNumber = "111222333",
                Title = "Mr",
                MiddleNames = "No",
                Username = "jackfilter@hmcts.net"
            };
            _response.Add(participantToFilter);
            
            var expectedResponse = new List<PersonResponse>();
            expectedResponse.Add(_response[0]);
            
            _bookingsApiClient.Setup(x => x.PostPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(_response);

            _userAccountService.Setup(x => x.GetJudgeUsers()).ReturnsAsync(new List<JudgeResponse>());

            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(new List<PersonResponse>());
            
            var searchTerm = "ado";

            // Act
            var result = await _controller.PostPersonBySearchTerm(searchTerm);

            // Assert
            var okObjectResult = result.Result.Should().BeAssignableTo<OkObjectResult>().Which;
            okObjectResult.Value.Should().BeEquivalentTo(expectedResponse);
            _bookingsApiClient.Verify(x => x.PostPersonBySearchTermAsync(It.Is<SearchTermRequest>(request => request.Term == searchTerm)), Times.Once);
            _bookingsApiClient.Verify(x => x.PostJudiciaryPersonBySearchTermAsync(It.Is<SearchTermRequest>(request => request.Term == searchTerm)), Times.Once);
            _userAccountService.Verify(x => x.GetJudgeUsers(), Times.Once);
        }
        
        [Test]
        public async Task Should_pass_on_bad_request_from_bookings_api()
        {
            _userAccountService.Setup(x => x.GetJudgeUsers()).ReturnsAsync(new List<JudgeResponse>());

            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(new List<PersonResponse>());
            
            _bookingsApiClient.Setup(x => x.PostPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var response = await _controller.PostPersonBySearchTerm("term");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public void Should_pass_on_exception_request_from_bookings_api()
        {
            _userAccountService.Setup(x => x.GetJudgeUsers()).ReturnsAsync(new List<JudgeResponse>());

            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(new List<PersonResponse>());
            
            _bookingsApiClient.Setup(x => x.PostPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            Assert.ThrowsAsync<BookingsApiException>(() => _controller.PostPersonBySearchTerm("term"));
        }
    }
}
