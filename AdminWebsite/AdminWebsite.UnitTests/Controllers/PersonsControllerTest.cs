using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UserAPI.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using Testing.Common;

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
            _controller = new AdminWebsite.Controllers.PersonsController(_bookingsApiClient.Object);

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
            _bookingsApiClient.Setup(x => x.GetPersonBySearchTermAsync(It.IsAny<string>()))
                              .ReturnsAsync(_response);

            var searchTerm = "ado";
            var result = await _controller.GetPersonBySearchTerm(searchTerm);

            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
        }

        [Test]
        public async Task PersonController_should_pass_on_bad_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.GetPersonBySearchTermAsync(It.IsAny<string>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var response = await _controller.GetPersonBySearchTerm("term");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public async Task PersonController_should_pass_on_exeption_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.GetPersonBySearchTermAsync(It.IsAny<string>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            try
            {
                await _controller.GetPersonBySearchTerm("term");
            }
            catch(Exception e)
            {
                e.Should().BeOfType(typeof(BookingsApiException));
            }
        }
    }
}
