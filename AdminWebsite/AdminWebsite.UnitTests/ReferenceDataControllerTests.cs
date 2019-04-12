using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Controllers;
using AdminWebsite.Security;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;

namespace AdminWebsite.UnitTests
{
    public class ReferenceDataControllerTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        private Mock<IUserIdentity> _userIdentityMock;
        private ReferenceDataController _controller;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _userIdentityMock = new Mock<IUserIdentity>();
            _controller = new ReferenceDataController(_bookingsApiClientMock.Object, _userIdentityMock.Object);
        }

        [Test]
        public void should_return_a_list_of_venues()
        {
            var hearingVenues = Builder<HearingVenueResponse>.CreateListOfSize(2).Build().ToList();
            _bookingsApiClientMock.Setup(x => x.GetHearingVenuesAsync()).ReturnsAsync(hearingVenues);

            var response = _controller.GetCourts();
            var result = (OkObjectResult)response.Result.Result;
            result.Value.Should().Be(hearingVenues);
        }
    }
}
