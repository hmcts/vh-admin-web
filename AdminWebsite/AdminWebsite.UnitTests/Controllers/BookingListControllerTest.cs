﻿using AdminWebsite.Contracts.Requests;
using AdminWebsite.Security;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Mvc;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using BookingsApi.Contract.V2.Responses;

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

            _controller = new AdminWebsite.Controllers.BookingListController(
                _bookingsApiClient.Object,
                _userIdentity.Object,
                JavaScriptEncoder.Default);
        }

        [Test]
        public async Task Should_return_booking_list_if_cursor_is_null()
        {
            _userIdentity.Setup(x => x.IsATeamLead()).Returns(true);

            _bookingsApiClient.Setup(x =>
            x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()))
                .ReturnsAsync(new BookingsResponse());

            var request = new BookingSearchRequest 
            {
                Cursor = null,
                Limit = 100
            };

            var result = await _controller.GetBookingsList(request);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task Should_return_booking_list_if_cursor_is_not_null()
        {
            _userIdentity.Setup(x => x.IsATeamLead()).Returns(true);
            _bookingsApiClient.Setup(x =>
                    x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()))
                .ReturnsAsync(new BookingsResponse());
            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2" });

            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(new List<CaseTypeResponseV2>());

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100
            };

            var result = await _controller.GetBookingsList(request);

            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task Should_return_unauthorized_for_booking_list_if_user_is_not_admin()
        {
            _userIdentity.Setup(x => x.IsATeamLead()).Returns(false);

            _bookingsApiClient.Setup(x =>
           x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()))
               .ReturnsAsync(new BookingsResponse());

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100
            };

            var result = await _controller.GetBookingsList(request);

            var unauthorizedResult = (UnauthorizedResult)result;
            unauthorizedResult.StatusCode.Should().Be(401);
        }

        [Test]
        public async Task Should_throw_exception_for_booking_list_and_returns_bad_result()
        {
            _userIdentity.Setup(x => x.IsATeamLead()).Returns(true);

            _bookingsApiClient.Setup(x =>
           x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()))
                .Throws(new BookingsApiException("Error", 400, "response", null, null));

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100
            };

            var badResult = await _controller.GetBookingsList(request) as BadRequestObjectResult;

            badResult.StatusCode.Should().Be(400);
        }

        [Test]
        public async Task Should_return_ok_for_booking_list_with_null_types_in_database()
        {
            SetupTestCase();
            List<CaseTypeResponseV2> response = null;
            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(response);

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100
            };

            var result = await _controller.GetBookingsList(request);

            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task Should_return_ok_for_booking_list_with_empty_list_of_types()
        {
            SetupTestCase();

            var response = new List<CaseTypeResponseV2>();
            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(response);

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100
            };

            var result = await _controller.GetBookingsList(request);

            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task
            Should_return_ok_for_booking_list_if_no_parameters_case_types_are_matched_with_database_types()
        {
            SetupTestCase();

            var response = new List<CaseTypeResponseV2>
            {
                new CaseTypeResponseV2()
                {
                    Id = 1, Name = "type3"
                },
                new CaseTypeResponseV2
                {
                    Id = 2, Name = "type4"
                }
            };

            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(response);

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100
            };

            var result = await _controller.GetBookingsList(request);

            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }


        [Test]
        public async Task Should_return_ok_for_booking_list_with_defined_types_list()
        {
            _userIdentity.Setup(x => x.IsATeamLead()).Returns(true);

            _bookingsApiClient.Setup(x =>
                    x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()))
                .ReturnsAsync(new BookingsResponse());

            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2" });

            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(() => GetCaseTypesList());

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100
            };

            var okResult = await _controller.GetBookingsList(request) as OkObjectResult;

            okResult.StatusCode.Should().Be(200);

            _userIdentity.Verify(x => x.IsATeamLead(), Times.Once);
            _bookingsApiClient.Verify(s => s.GetCaseTypesV2Async(true), Times.Once);
            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_return_ok_for_booking_list_and_exclude_repeated_types()
        {
            var caseTypeIds = new List<string> { "1", "2" };

            _userIdentity.Setup(x => x.IsATeamLead()).Returns(true);

            _bookingsApiClient.Setup(x =>
                    x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()))
                .ReturnsAsync(new BookingsResponse());

            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2", "type2" });

            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(() => GetCaseTypesList());

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100,
                CaseTypes = caseTypeIds
            };

            var okResult = await _controller.GetBookingsList(request) as OkObjectResult;

            okResult.StatusCode.Should().Be(200);

            _userIdentity.Verify(x => x.IsATeamLead(), Times.Once);
            _bookingsApiClient.Verify(s => s.GetCaseTypesV2Async(true), Times.Once);
            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_return_booking_list_when_admin_search_by_case_number()
        {
            SetupTestCase();

            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(default(List<CaseTypeResponseV2>));

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100,
                CaseNumber = "AA102993"
            };

            var result = await _controller.GetBookingsList(request);

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task Should_return_booking_list_when_admin_search_by_venue_ids()
        {
            SetupTestCase();

            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(default(List<CaseTypeResponseV2>));

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                VenueIds = new List<int> { 1, 2 }
            };

            var result = await _controller.GetBookingsList(request);

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task Should_return_booking_list_when_admin_search_by_last_name()
        {
            SetupTestCase();

            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(default(List<CaseTypeResponseV2>));

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                LastName = "Participant_LastName"
            };

            var result = await _controller.GetBookingsList(request);

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);

            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()), Times.Once);

        }

        [Test]
        public async Task Should_return_booking_list_when_admin_search_by_case_types()
        {
            SetupTestCase();

            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(default(List<CaseTypeResponseV2>));

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100,
                CaseTypes = new List<string> { "Tribunal", "Mental Health" }
            };

            var result = await _controller.GetBookingsList(request);

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task Should_return_bookings_list_when_admin_search_by_start_date()
        {
            SetupTestCase();

            var startDate = new DateTime(2022, 3, 25, 0, 0, 0, DateTimeKind.Utc);

            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(default(List<CaseTypeResponseV2>));

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100,
                StartDate = startDate
            };

            var result = await _controller.GetBookingsList(request);

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);

            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_return_bookings_list_when_admin_search_by_end_date()
        {
            SetupTestCase();

            var endDate = new DateTime(2022, 3, 25, 0, 0, 0, DateTimeKind.Utc);

            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(default(List<CaseTypeResponseV2>));

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100,
                EndDate = endDate
            };

            var result = await _controller.GetBookingsList(request);

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_return_bookings_list_when_admin_search_by_start_and_end_date()
        {
            SetupTestCase();

            var startDate = new DateTime(2022, 3, 24, 0, 0, 0, DateTimeKind.Utc);
            var endDate = new DateTime(2022, 3, 25, 0, 0, 0, DateTimeKind.Utc);

            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(default(List<CaseTypeResponseV2>));

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100,
                StartDate = startDate,
                EndDate = endDate
            };

            var result = await _controller.GetBookingsList(request);

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);

            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_return_bad_request_when_admin_search_with_start_date_after_end_date()
        {
            SetupTestCase();

            var startDate = new DateTime(2022, 3, 25, 0, 0, 0, DateTimeKind.Utc);
            var endDate = new DateTime(2022, 3, 24, 0, 0, 0, DateTimeKind.Utc);

            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(default(List<CaseTypeResponseV2>));

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100,
                StartDate = startDate,
                EndDate = endDate
            };

            var result = await _controller.GetBookingsList(request);

            result.Should().BeOfType<BadRequestObjectResult>();

            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()), Times.Never);
        }

        [Test]
        public async Task Should_return_booking_list_when_admin_search_by_multiple_criteria()
        {
            SetupTestCase();

            _bookingsApiClient.Setup(s => s.GetCaseTypesV2Async(true)).ReturnsAsync(default(List<CaseTypeResponseV2>));

            var request = new BookingSearchRequest
            {
                Cursor = "cursor",
                Limit = 100,
                CaseNumber = "AA102993",
                VenueIds = new List<int> { 1, 2 },
                CaseTypes = new List<string> { "Tribunal", "Mental Health" },
                LastName = "Participant_LastName"
            };

            var result = await _controller.GetBookingsList(request);

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);
        }

        private static List<CaseTypeResponseV2> GetCaseTypesList()
        {
            return new List<CaseTypeResponseV2>
            {
                new()
                {
                    Id = 1, Name = "type1"
                },
                new()
                {
                    Id = 2, Name = "type2"
                },
                new()
                {
                    Id = 3, Name = "type3"
                }
            };
        }

        private void SetupTestCase()
        {
            _userIdentity.Setup(x => x.IsATeamLead()).Returns(true);
            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2" });
            _bookingsApiClient.Setup(x =>
                    x.GetHearingsByTypesAsync(It.IsAny<GetHearingRequest>()))
                .ReturnsAsync(new BookingsResponse());
        }

    }
}