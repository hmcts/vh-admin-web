﻿using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Threading.Tasks;
using System.Text.Encodings.Web;
using AdminWebsite.UnitTests.Helper;
using AdminWebsite.Configuration;
using AdminWebsite.Services;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;
using Microsoft.Extensions.Options;

namespace AdminWebsite.UnitTests.Controllers
{

    public class PersonsControllerTest
    {
        private AdminWebsite.Controllers.PersonsController _controller;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserAccountService> _userAccountService;
        private List<PersonResponseV2> _response;

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

            _response = new List<PersonResponseV2>
            {
                new PersonResponseV2
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
            var additionalParticipantToReturn = new PersonResponseV2
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
            
            var searchTerm = "ado";

            var expectedResponse = new List<PersonResponseV2>
            {
                _response[0],
                additionalParticipantToReturn
            };

            _bookingsApiClient.Setup(x => x.SearchForPersonV2Async(It.Is<SearchTermRequestV2>(searchTermRequest => searchTermRequest.Term == searchTerm)))
                .ReturnsAsync(_response);

            
            // Act
            var result = await _controller.PostPersonBySearchTerm(searchTerm);

            // Assert
            var okObjectResult = result.Result.Should().BeAssignableTo<OkObjectResult>().Which;
            okObjectResult.Value.Should().BeEquivalentTo(expectedResponse);
            _bookingsApiClient.Verify(x => x.SearchForPersonV2Async(It.Is<SearchTermRequestV2>(request => request.Term == searchTerm)), Times.Once);
            
        }
        
        
        
        [Test]
        public async Task Should_filter_TestUsernameStem()
        {
            // Arrange
            var participantToFilter = new PersonResponseV2
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
            
            var searchTerm = "ado";

            var expectedResponse = new List<PersonResponseV2>
            {
                _response[0]
            };

            _bookingsApiClient.Setup(x => x.SearchForPersonV2Async(It.Is<SearchTermRequestV2>(searchTermRequest => searchTermRequest.Term == searchTerm)))
                .ReturnsAsync(_response);
                       
            // Act
            var result = await _controller.PostPersonBySearchTerm(searchTerm);

            // Assert
            var okObjectResult = result.Result.Should().BeAssignableTo<OkObjectResult>().Which;
            okObjectResult.Value.Should().BeEquivalentTo(expectedResponse);
            _bookingsApiClient.Verify(x => x.SearchForPersonV2Async(It.Is<SearchTermRequestV2>(request => request.Term == searchTerm)), Times.Once);
            
        }
        
        [Test]
        public async Task Should_pass_on_bad_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(new List<JudiciaryPersonResponse>());
            
            _bookingsApiClient.Setup(x => x.SearchForPersonV2Async(It.IsAny<SearchTermRequestV2>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var response = await _controller.PostPersonBySearchTerm("term");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public void Should_pass_on_exception_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(new List<JudiciaryPersonResponse>());
            
            _bookingsApiClient.Setup(x => x.SearchForPersonV2Async(It.IsAny<SearchTermRequestV2>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            Assert.ThrowsAsync<BookingsApiException>(() => _controller.PostPersonBySearchTerm("term"));
        }
    }
}
