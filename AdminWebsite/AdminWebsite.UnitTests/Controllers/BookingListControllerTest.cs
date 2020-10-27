using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Security;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Text.Encodings.Web;

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
        public void Should_return_booking_list_if_cursor_is_null()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>()))
                .Returns(new BookingsResponse());

            var result = _controller.GetBookingsList(null, 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public void Should_return_booking_list_if_cursor_is_not_null()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>()))
                .Returns(new BookingsResponse());
            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2" });

            _bookingsApiClient.Setup(s => s.GetCaseTypes()).Returns(new List<CaseTypeResponse>());

            var result = _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public void Should_return_unauthorized_for_booking_list_if_user_is_not_admin()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(false);
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>()))
                .Returns(new BookingsResponse());

            var result = _controller.GetBookingsList("cursor", 100);
            var unauthorizedResult = (UnauthorizedResult)result;
            unauthorizedResult.StatusCode.Should().Be(401);
        }
        [Test]
        public void Should_throw_exception_for_booking_list_and_returns_bad_result()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>()))
                .Throws(new BookingsApiException("Error", 400, "response", null, null));

            var result = _controller.GetBookingsList("cursor", 100);
            var badResult = (BadRequestObjectResult)result;
            badResult.StatusCode.Should().Be(400);
        }

        [Test]
        public void Should_return_ok_for_booking_list_with_null_types_in_database()
        {
            SetupTestCase();
            List<CaseTypeResponse> response = null;
            _bookingsApiClient.Setup(s => s.GetCaseTypes()).Returns(response);

            var result = _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public void Should_return_ok_for_booking_list_with_empty_list_of_types()
        {
            SetupTestCase();

            var response = new List<CaseTypeResponse>();
            _bookingsApiClient.Setup(s => s.GetCaseTypes()).Returns(response);

            var result = _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public void Should_return_ok_for_booking_list_if_no_parameters_case_types_are_matched_with_database_types()
        {
            SetupTestCase();

            var response = new List<CaseTypeResponse>
            {
                new CaseTypeResponse
                {
                    Hearing_types = new List<HearingTypeResponse>(), Id=1, Name="type3"
                },
                new CaseTypeResponse
                {
                    Hearing_types = new List<HearingTypeResponse>(), Id=2, Name="type4"
                }
            };

            _bookingsApiClient.Setup(s => s.GetCaseTypes()).Returns(response);

            var result = _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }


        [Test]
        public void Should_return_ok_for_booking_list_with_defined_types_list()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            var hearingTypesIds = new List<int> { 1, 2 };
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(hearingTypesIds, It.IsAny<string>(), It.IsAny<int>()))
                  .Returns(new BookingsResponse());
            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2" });
            var response = GetCaseTypesList();

            _bookingsApiClient.Setup(s => s.GetCaseTypes()).Returns(response);

            var result = _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.GetHearingsByTypes(hearingTypesIds, "cursor", 100), Times.Once);
        }

        [Test]
        public void Should_return_ok_for_booking_list_and_exclude_repeted_types()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            var hearingTypesIds = new List<int> { 1, 2 };
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(hearingTypesIds, It.IsAny<string>(), It.IsAny<int>()))
                  .Returns(new BookingsResponse());
            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2", "type2" });
            var response = GetCaseTypesList();

            _bookingsApiClient.Setup(s => s.GetCaseTypes()).Returns(response);

            var result = _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.GetHearingsByTypes(hearingTypesIds, "cursor", 100), Times.Once);
        }

        private List<CaseTypeResponse> GetCaseTypesList()
        {
            return new List<CaseTypeResponse>
            {
                new CaseTypeResponse
                {
                    Hearing_types = new List<HearingTypeResponse>(), Id=1, Name="type1"
                },
                new CaseTypeResponse
                {
                    Hearing_types = new List<HearingTypeResponse>(), Id=2, Name="type2"
                },
                new CaseTypeResponse
                {
                    Hearing_types = new List<HearingTypeResponse>(), Id=3, Name="type3"
                }
            };
        }
        private void SetupTestCase()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2" });
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>()))
                  .Returns(new BookingsResponse());
        }

    }
}
