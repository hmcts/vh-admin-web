using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Controllers;
using AdminWebsite.Security;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace AdminWebsite.UnitTests.Controllers
{
    public class SuitabilityControllerTest
    {
        private SuitabilityAnswersController _controller;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        private Mock<IUserIdentity> _userIdentityMock;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _userIdentityMock = new Mock<IUserIdentity>();
            _controller = new SuitabilityAnswersController(_bookingsApiClientMock.Object, _userIdentityMock.Object, UrlEncoder.Default);
        }

        [Test]
        public async Task Should_retrieve_the_suitability_answers()
        {
            var response = new SuitabilityAnswersResponse();

            _userIdentityMock.Setup(s => s.IsVhOfficerAdministratorRole()).Returns(true);
            _bookingsApiClientMock.Setup(s => s.GetSuitabilityAnswersAsync("", 1)).ReturnsAsync(response);


            var result = await _controller.GetSuitabilityAnswersList("", 1);

            result.Should().NotBeNull();
            var objectResult = (ObjectResult)result;
            objectResult.StatusCode.Should().Be((int)HttpStatusCode.OK);
        }

        [Test]
        public async Task Should_return_unauthorized()
        {
            _userIdentityMock.Setup(s => s.IsVhOfficerAdministratorRole()).Returns(false);

            var result = await _controller.GetSuitabilityAnswersList("", 1);

            result.Should().NotBeNull();

            var objectResult = (UnauthorizedResult)result;
            objectResult.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized);
        }

        [Test]
        public async Task Should_return_badRequest_if_exception_throw()
        {
            _userIdentityMock.Setup(s => s.IsVhOfficerAdministratorRole()).Returns(true);
            _bookingsApiClientMock.Setup(s => s.GetSuitabilityAnswersAsync("", 1)).Throws(new BookingsApiException("error",400,"",new Dictionary<string, IEnumerable<string>>(), new Exception()));

            var result = await _controller.GetSuitabilityAnswersList("", 1);

            result.Should().NotBeNull();

            var objectResult = (BadRequestObjectResult)result;
            objectResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
    }
}
