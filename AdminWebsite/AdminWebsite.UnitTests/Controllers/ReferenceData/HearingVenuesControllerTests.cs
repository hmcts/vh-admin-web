using System.Linq;
using System.Threading;
using AdminWebsite.Controllers.ReferenceData;
using AdminWebsite.Services;
using Autofac.Extras.Moq;
using BookingsApi.Contract.V1.Responses;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.UnitTests.Controllers.ReferenceData
{
    public class HearingVenuesControllerTests
    {
        private Mock<IReferenceDataService> _referenceDataServiceMock;
        private HearingVenuesController _controller;
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _referenceDataServiceMock = _mocker.Mock<IReferenceDataService>();
            _controller = _mocker.Create<HearingVenuesController>();
        }

        [Test]
        public void Should_return_a_list_of_venues()
        {
            var hearingVenues = Builder<HearingVenueResponse>.CreateListOfSize(2).Build().ToList();
            _referenceDataServiceMock.Setup(x => x.GetHearingVenuesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(hearingVenues);

            var response = _controller.GetCourts();
            var result = (OkObjectResult)response.Result.Result;
            result.Value.Should().Be(hearingVenues);
        }
    }
}
