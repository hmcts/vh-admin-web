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
    public class GetPersonForUpdateByContactEmailTests
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
                TestUsernameStem = "@hmcts.net"
            };

            _controller = new AdminWebsite.Controllers.PersonsController(_bookingsApiClient.Object,
                JavaScriptEncoder.Default, Options.Create(testSettings), _userAccountService.Object);
        }

        [Test]
        public async Task should_return_ok_with_person()
        {
            var contactEmail = "john@hmcts.net";
            var person = Builder<PersonResponse>.CreateNew().Build();
            _bookingsApiClient
                .Setup(x => x.SearchForNonJudgePersonsByContactEmailAsync(contactEmail))
                .ReturnsAsync(person);
            
            var actionResult = await _controller.GetPersonForUpdateByContactEmail(contactEmail);
            
            actionResult.Result.Should().BeOfType<OkObjectResult>();
            var okResult = (OkObjectResult) actionResult.Result;
            okResult.Value.Should().Be(person);
        }

        [Test]
        public async Task should_return_status_code_from_bookings_api_exception()
        {
            var contactEmail = "john@hmcts.net";
            _bookingsApiClient
                .Setup(x => x.SearchForNonJudgePersonsByContactEmailAsync(contactEmail))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));
            
            var actionResult = await _controller.GetPersonForUpdateByContactEmail(contactEmail);
            actionResult.Result.Should().BeOfType<ObjectResult>();
            var result = (ObjectResult) actionResult.Result;
            result.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
        }
    }
}