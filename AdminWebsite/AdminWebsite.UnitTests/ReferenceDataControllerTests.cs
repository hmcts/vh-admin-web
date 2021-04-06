using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Controllers;
using AdminWebsite.Models;
using AdminWebsite.Security;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Services;
using AdminWebsite.Services.Models;
using Autofac.Extras.Moq;
using HearingTypeResponse = AdminWebsite.BookingsAPI.Client.HearingTypeResponse;

namespace AdminWebsite.UnitTests
{
    public class ReferenceDataControllerTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        private Mock<IUserIdentity> _userIdentityMock;
        private ReferenceDataController _controller;
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _bookingsApiClientMock = _mocker.Mock<IBookingsApiClient>();
            _userIdentityMock = _mocker.Mock<IUserIdentity>();
            _controller = _mocker.Create<ReferenceDataController>();
        }

        [Test]
        public void Should_return_a_list_of_venues()
        {
            var hearingVenues = Builder<HearingVenueResponse>.CreateListOfSize(2).Build().ToList();
            _bookingsApiClientMock.Setup(x => x.GetHearingVenuesAsync()).ReturnsAsync(hearingVenues);

            var response = _controller.GetCourts();
            var result = (OkObjectResult)response.Result.Result;
            result.Value.Should().Be(hearingVenues);
        }

        [Test]
        public async Task Should_return_hearing_types()
        {
            _userIdentityMock.Setup(x => x.GetAdministratorCaseTypes()).Returns(new List<string> { "type1", "type2" });

            var listTypes = new List<CaseTypeResponse> { new CaseTypeResponse { Id = 1, Name = "type1",
                Hearing_types = new List<HearingTypeResponse>
                {
                   new HearingTypeResponse{Id=1, Name="type1"},
                } } };

            _bookingsApiClientMock.Setup(x => x.GetCaseTypesAsync()).ReturnsAsync(listTypes);

            var response = await _controller.GetHearingTypes();
            var result = response.Value;
            result.Should().NotBeNull();
            result.Count.Should().Be(1);
            result[0].Group.Should().Be("type1");
            result[0].Id.Should().Be(1);
            result[0].Name.Should().Be("type1");
            result[0].Code.Should().Be(string.Empty);
        }

        [Test]
        public async Task Should_return_participants_roles()
        {
            var listTypes = new List<CaseRoleResponse> { new CaseRoleResponse { Name = "type1" } };
            SetTestCase(listTypes);

            var response = await _controller.GetParticipantRoles("type1");
            response.Should().NotBeNull();
            var result = (OkObjectResult)response.Result;
            var caseRoles = (List<CaseAndHearingRolesResponse>)result.Value;
            caseRoles[0].Name.Should().Be("type1");
            caseRoles[0].HearingRoles.Should().NotBeNull();
            caseRoles[0].HearingRoles.Count().Should().Be(1);
            caseRoles[0].HearingRoles.First().Name.Should().Be("type1");
            caseRoles[0].HearingRoles.First().UserRole.Should().Be("role1");
        }

        [Test]
        public async Task Should_return_empty_list_of_participants_roles()
        {
            var listTypes = new List<CaseRoleResponse>();
            SetTestCase(listTypes);

            var response = await _controller.GetParticipantRoles("type1");
            response.Should().NotBeNull();
            var result = (OkObjectResult)response.Result;
            List<CaseAndHearingRolesResponse> caseRoles = (List<CaseAndHearingRolesResponse>)result.Value;
            caseRoles.Count.Should().Be(0);
        }

        [Test]
        public async Task Should_return_empty_list_of_participants_roles_if_list_types_is_null()
        {
            List<CaseRoleResponse> listTypes = null;
            SetTestCase(listTypes);

            var response = await _controller.GetParticipantRoles("type1");
            response.Should().NotBeNull();
            var result = (OkObjectResult)response.Result;
            List<CaseAndHearingRolesResponse> caseRoles = (List<CaseAndHearingRolesResponse>)result.Value;
            caseRoles.Count.Should().Be(0);
        }

        [Test]
        public async Task should_return_list_of_upcoming_public_holidays()
        {
            var publicHolidays = Builder<PublicHoliday>.CreateListOfSize(10).Build().ToList();
            _mocker.Mock<IPublicHolidayRetriever>().Setup(x => x.RetrieveUpcomingHolidays())
                .ReturnsAsync(publicHolidays);

            var response = await _controller.PublicHolidays();
            response.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeOfType<List<PublicHolidayResponse>>();
            var responseHolidays = response.Result.As<OkObjectResult>().Value.As<List<PublicHolidayResponse>>();
            responseHolidays.Should().HaveCount(publicHolidays.Count);
        }
        
        private void SetTestCase(List<CaseRoleResponse> listTypes)
        {
            var listHearingRoles = new List<HearingRoleResponse> { new HearingRoleResponse { Name = "type1", User_role = "role1"} };

            _userIdentityMock.Setup(x => x.GetAdministratorCaseTypes()).Returns(new List<string> { "type1", "type2" });
            _bookingsApiClientMock.Setup(x => x.GetCaseRolesForCaseTypeAsync(It.IsAny<string>())).ReturnsAsync(listTypes);
            _bookingsApiClientMock.Setup(x => x.GetHearingRolesForCaseRoleAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(listHearingRoles);
        }
    }
}
