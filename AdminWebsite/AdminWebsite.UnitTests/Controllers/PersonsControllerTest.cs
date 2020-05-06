using AdminWebsite.BookingsAPI.Client;
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
using Microsoft.Extensions.Options;

namespace AdminWebsite.UnitTests.Controllers
{

    public class PersonsControllerTest
    {
        private AdminWebsite.Controllers.PersonsController _controller;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private List<PersonResponse> _response;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            var serviceSettings = new ServiceSettings
            {
                ValidateEmail = "@hearings.reform.hmcts.net"
            };
            _controller = new AdminWebsite.Controllers.PersonsController(_bookingsApiClient.Object, JavaScriptEncoder.Default, Options.Create(serviceSettings));

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
        public async Task PersonsController_should_return_request_if_match_to_search_term()
        {
            _bookingsApiClient.Setup(x => x.PostPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                              .ReturnsAsync(_response);

            var searchTerm = "ado";
            var result = await _controller.PostPersonBySearchTerm(searchTerm);

            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
        }

        [Test]
        public async Task PersonController_should_pass_on_bad_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.PostPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var response = await _controller.PostPersonBySearchTerm("term");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public void PersonController_should_pass_on_exception_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.PostPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            Assert.ThrowsAsync<BookingsApiException>(() => _controller.PostPersonBySearchTerm("term"));
        }
    }
}
