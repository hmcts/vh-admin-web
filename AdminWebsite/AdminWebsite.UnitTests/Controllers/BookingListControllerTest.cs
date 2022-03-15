using AdminWebsite.Security;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.Responses;
using System;

namespace AdminWebsite.UnitTests.Controllers
{
    public class BookingListControllerTest
    {
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;

        private AdminWebsite.Controllers.BookingListController _controller;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();

            _controller = new AdminWebsite.Controllers.BookingListController(_bookingsApiClient.Object,
                _userIdentity.Object,
                JavaScriptEncoder.Default);
        }

        [Test]
        public async Task Should_return_booking_list_if_cursor_is_null()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            _bookingsApiClient.Setup(x =>
                    x.GetHearingsByTypesAsync(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<string>(), It.IsAny<List<int>>()))
                .ReturnsAsync(new BookingsResponse());

            var result = await _controller.GetBookingsList(null, 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task Should_return_booking_list_if_cursor_is_not_null()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            _bookingsApiClient.Setup(x =>
                    x.GetHearingsByTypesAsync(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<string>(), It.IsAny<List<int>>()))
                .ReturnsAsync(new BookingsResponse());
            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2" });

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(new List<CaseTypeResponse>());

            var result = await _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task Should_return_unauthorized_for_booking_list_if_user_is_not_admin()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(false);
            _bookingsApiClient.Setup(x =>
                    x.GetHearingsByTypesAsync(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<string>(), It.IsAny<List<int>>()))
                .ReturnsAsync(new BookingsResponse());

            var result = await _controller.GetBookingsList("cursor", 100);
            var unauthorizedResult = (UnauthorizedResult)result;
            unauthorizedResult.StatusCode.Should().Be(401);
        }

        [Test]
        public async Task Should_throw_exception_for_booking_list_and_returns_bad_result()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);

            _bookingsApiClient.Setup(x =>
                    x.GetHearingsByTypesAsync(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>(), null, It.IsAny<string>(), It.IsAny<List<int>>()))
                .Throws(new BookingsApiException("Error", 400, "response", null, null));

            var badResult = await _controller.GetBookingsList("cursor", 100) as BadRequestObjectResult;

            badResult.StatusCode.Should().Be(400);
        }

        [Test]
        public async Task Should_return_ok_for_booking_list_with_null_types_in_database()
        {
            SetupTestCase();
            List<CaseTypeResponse> response = null;
            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(response);

            var result = await _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task Should_return_ok_for_booking_list_with_empty_list_of_types()
        {
            SetupTestCase();

            var response = new List<CaseTypeResponse>();
            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(response);

            var result = await _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task
            Should_return_ok_for_booking_list_if_no_parameters_case_types_are_matched_with_database_types()
        {
            SetupTestCase();

            var response = new List<CaseTypeResponse>
            {
                new CaseTypeResponse
                {
                    HearingTypes = new List<HearingTypeResponse>(), Id = 1, Name = "type3"
                },
                new CaseTypeResponse
                {
                    HearingTypes = new List<HearingTypeResponse>(), Id = 2, Name = "type4"
                }
            };

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(response);

            var result = await _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }


        [Test]
        public async Task Should_return_ok_for_booking_list_with_defined_types_list()
        {
            var hearingTypesIds = new List<int> { 1, 2 };

            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);

            _bookingsApiClient.Setup(x =>
                    x.GetHearingsByTypesAsync(hearingTypesIds, It.IsAny<string>(), It.IsAny<int>(), null, It.IsAny<string>(), It.IsAny<List<int>>()))
                .ReturnsAsync(new BookingsResponse());

            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2" });

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(() => GetCaseTypesList());

            var okResult = await _controller.GetBookingsList("cursor", 100) as OkObjectResult;

            okResult.StatusCode.Should().Be(200);

            _userIdentity.Verify(x => x.IsAdministratorRole(), Times.Once);
            _bookingsApiClient.Verify(s => s.GetCaseTypesAsync(), Times.Once);
            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(hearingTypesIds, "cursor", 100, null, It.IsAny<string>(), It.IsAny<List<int>>()), Times.Once);
        }

        [Test]
        public async Task Should_return_ok_for_booking_list_and_exclude_repeated_types()
        {
            var hearingTypesIds = new List<int> { 1, 2 };

            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);

            _bookingsApiClient.Setup(x =>
                  x.GetHearingsByTypesAsync(hearingTypesIds, It.IsAny<string>(), It.IsAny<int>(), null, It.IsAny<string>(), It.IsAny<List<int>>()))
                .ReturnsAsync(() => new BookingsResponse());

            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2", "type2" });

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(() => GetCaseTypesList());

            var okResult = await _controller.GetBookingsList("cursor", 100) as OkObjectResult;

            okResult.StatusCode.Should().Be(200);
            
            _userIdentity.Verify(x => x.IsAdministratorRole(), Times.Once);
            _bookingsApiClient.Verify(s => s.GetCaseTypesAsync(), Times.Once);
            _bookingsApiClient.Verify(
                x => x.GetHearingsByTypesAsync(hearingTypesIds, It.IsAny<string>(), It.IsAny<int>(), null, It.IsAny<string>(), It.IsAny<List<int>>()), Times.Once);
        }

        [Test]
        public async Task Should_return_booking_list_when_admin_search_by_case_number()
        {
            SetupTestCase();

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(default(List<CaseTypeResponse>));

            var result = await _controller.GetBookingsList("cursor", 100, caseNumber: "AA102993");

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task Should_return_booking_list_when_admin_search_by_venue_ids()
        {
            SetupTestCase();

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(default(List<CaseTypeResponse>));

            var result = await _controller.GetBookingsList("cursor", 100, venueIds: new List<int>{ 1, 2 });

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);
        }
        
        [Test]
        public async Task Should_return_booking_list_when_admin_search_by_multiple_criteria()
        {
            SetupTestCase();

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(default(List<CaseTypeResponse>));

            var result = await _controller.GetBookingsList("cursor", 100, caseNumber: "AA102993", venueIds: new List<int>{ 1, 2 });

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);
        }

        private List<CaseTypeResponse> GetCaseTypesList()
        {
            return new List<CaseTypeResponse>
            {
                new CaseTypeResponse
                {
                    HearingTypes = new List<HearingTypeResponse>(), Id = 1, Name = "type1"
                },
                new CaseTypeResponse
                {
                    HearingTypes = new List<HearingTypeResponse>(), Id = 2, Name = "type2"
                },
                new CaseTypeResponse
                {
                    HearingTypes = new List<HearingTypeResponse>(), Id = 3, Name = "type3"
                }
            };
        }

        private void SetupTestCase()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2" });
            _bookingsApiClient.Setup(x =>
                    x.GetHearingsByTypesAsync(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<string>(), It.IsAny<List<int>>()))
                .ReturnsAsync(new BookingsResponse());
        }

    }
}
