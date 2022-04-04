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
using BookingsApi.Contract.Requests;

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
            _bookingsApiClient.Setup(x => x.GetHearingsByTypesAsync(GetSearchiHearingRequest()))
                .ReturnsAsync(new BookingsResponse());

            var result = await _controller.GetBookingsList(null, 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task Should_return_booking_list_if_cursor_is_not_null()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            _bookingsApiClient.Setup(x => x.GetHearingsByTypesAsync(GetSearchiHearingRequest()))
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
            _bookingsApiClient.Setup(x => x.GetHearingsByTypesAsync(GetSearchiHearingRequest()))
               .ReturnsAsync(new BookingsResponse());

            var result = await _controller.GetBookingsList("cursor", 100);
            var unauthorizedResult = (UnauthorizedResult)result;
            unauthorizedResult.StatusCode.Should().Be(401);
        }

        [Test]
        public async Task Should_throw_exception_for_booking_list_and_returns_bad_result()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);

            var searchRequest = GetSearchiHearingRequest();
            searchRequest.CaseNumber = null;
            _bookingsApiClient.Setup(x => x.GetHearingsByTypesAsync(searchRequest))
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

            var searchRequest = GetSearchiHearingRequest();
            searchRequest.Types = hearingTypesIds;

            _bookingsApiClient.Setup(x => x.GetHearingsByTypesAsync(searchRequest))
               .ReturnsAsync(new BookingsResponse());

            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2" });

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(() => GetCaseTypesList());

            var okResult = await _controller.GetBookingsList("cursor", 100) as OkObjectResult;

            okResult.StatusCode.Should().Be(200);

            _userIdentity.Verify(x => x.IsAdministratorRole(), Times.Once);
            _bookingsApiClient.Verify(s => s.GetCaseTypesAsync(), Times.Once);
            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(new SearchHearingRequest
            {
                Types = hearingTypesIds,
                Cursor = "cursor",
                Limit = 100,
                CaseNumber = null,
                VenueIds = It.IsAny<List<int>>(),
                EndDate = null,
                LastName = It.IsAny<string>()
            }), Times.Once);
        }

        [Test]
        public async Task Should_return_ok_for_booking_list_and_exclude_repeated_types()
        {
            var hearingTypesIds = new List<int> { 1, 2 };

            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);

            var searchRequest = GetSearchiHearingRequest();
            searchRequest.Types = hearingTypesIds;

            _bookingsApiClient.Setup(x => x.GetHearingsByTypesAsync(searchRequest))
               .ReturnsAsync(new BookingsResponse());

            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2", "type2" });

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(() => GetCaseTypesList());

            var okResult = await _controller.GetBookingsList("cursor", 100) as OkObjectResult;

            okResult.StatusCode.Should().Be(200);
            
            _userIdentity.Verify(x => x.IsAdministratorRole(), Times.Once);
            _bookingsApiClient.Verify(s => s.GetCaseTypesAsync(), Times.Once);
            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(searchRequest), Times.Once);
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
        public async Task Should_return_booking_list_when_admin_search_by_case_types()
        {
            SetupTestCase();

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(default(List<CaseTypeResponse>));

            var result = await _controller.GetBookingsList("cursor", 100, caseTypes: new List<string>{ "Tribunal", "Mental Health" });

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public async Task Should_return_bookings_list_when_admin_search_by_start_date()
        {
            SetupTestCase();

            var startDate = new DateTime(2022, 3, 25);

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(default(List<CaseTypeResponse>));

            var result = await _controller.GetBookingsList("cursor", 100, startDate: startDate);

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);

            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(new SearchHearingRequest
            {
                Types = It.IsAny<List<int>>(),
                Cursor = "cursor",
                Limit = 100,
                CaseNumber = null,
                VenueIds = It.IsAny<List<int>>(),
                FromDate = startDate,
                EndDate = null,
                LastName = It.IsAny<string>()
            }), Times.Once);

        }

        [Test]
        public async Task Should_return_bookings_list_when_admin_search_by_end_date()
        {
            SetupTestCase();

            var endDate = new DateTime(2022, 3, 25);

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(default(List<CaseTypeResponse>));

            var result = await _controller.GetBookingsList("cursor", 100, endDate: endDate);

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);

            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(new SearchHearingRequest
            {
                Types = It.IsAny<List<int>>(),
                Cursor = "cursor",
                Limit = 100,
                CaseNumber = null,
                VenueIds = It.IsAny<List<int>>(),
                FromDate = null,
                EndDate = null,
                LastName = It.IsAny<string>()
            }), Times.Once);
        }

        [Test]
        public async Task Should_return_bookings_list_when_admin_search_by_start_and_end_date()
        {
            SetupTestCase();

            var startDate = new DateTime(2022, 3, 24);
            var endDate = new DateTime(2022, 3, 25);

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(default(List<CaseTypeResponse>));

            var result = await _controller.GetBookingsList("cursor", 100, startDate: startDate, endDate: endDate);

            var okResult = (OkObjectResult)result;

            okResult.StatusCode.Should().Be(200);

            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(new SearchHearingRequest
            {
                Types = It.IsAny<List<int>>(),
                Cursor = "cursor",
                Limit = 100,
                CaseNumber = null,
                VenueIds = It.IsAny<List<int>>(),
                FromDate = startDate,
                EndDate = endDate,
                LastName = It.IsAny<string>()
            }), Times.Once);

        }

        [Test]
        public async Task Should_return_bad_request_when_admin_search_with_start_date_after_end_date()
        {
            SetupTestCase();

            var startDate = new DateTime(2022, 3, 25);
            var endDate = new DateTime(2022, 3, 24);

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(default(List<CaseTypeResponse>));

            var result = await _controller.GetBookingsList("cursor", 100, startDate: startDate, endDate: endDate);

            result.Should().BeOfType<BadRequestObjectResult>();

            _bookingsApiClient.Verify(x => x.GetHearingsByTypesAsync(new SearchHearingRequest
            {
                Types = It.IsAny<List<int>>(),
                Cursor = "cursor",
                Limit = 100,
                CaseNumber = null,
                VenueIds = It.IsAny<List<int>>(),
                FromDate = startDate,
                EndDate = endDate,
                LastName = It.IsAny<string>()
            }), Times.Once);
        }
        
        [Test]
        public async Task Should_return_booking_list_when_admin_search_by_multiple_criteria()
        {
            SetupTestCase();

            _bookingsApiClient.Setup(s => s.GetCaseTypesAsync()).ReturnsAsync(default(List<CaseTypeResponse>));

            var result = await _controller.GetBookingsList("cursor", 100, caseNumber: "AA102993", venueIds: new List<int>{ 1, 2 }, caseTypes: new List<string>{ "Tribunal", "Mental Health" });

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
            _bookingsApiClient.Setup(x => x.GetHearingsByTypesAsync(GetSearchiHearingRequest()))
                .ReturnsAsync(new BookingsResponse());
        }

        private SearchHearingRequest GetSearchiHearingRequest()
        {
            return new SearchHearingRequest
            {
                Types = It.IsAny<List<int>>(),
                Cursor = It.IsAny<string>(),
                Limit = It.IsAny<int>(),
                FromDate = It.IsAny<DateTime>(),
                CaseNumber = It.IsAny<string>(),
                VenueIds = It.IsAny<List<int>>(),
                EndDate = It.IsAny<DateTime>(),
                LastName = It.IsAny<string>()
            };
        }
    }
}