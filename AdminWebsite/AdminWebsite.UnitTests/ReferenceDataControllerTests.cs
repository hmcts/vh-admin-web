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
using System.Text.Encodings.Web;
using System.Threading.Tasks;

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
            _controller = new ReferenceDataController(_bookingsApiClientMock.Object, _userIdentityMock.Object, JavaScriptEncoder.Default);
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
            List<CaseAndHearingRolesResponse> caseRoles = (List<CaseAndHearingRolesResponse>)result.Value;
            caseRoles[0].Name.Should().Be("type1");
            caseRoles[0].HearingRoles.Count.Should().Be(1);
        }

        [Test]
        public async Task Should_return_participants_roles_in_asc_order()
        {
            var listTypes = new List<CaseRoleResponse> { new CaseRoleResponse { Name = "type1" } };
            var listHearingRoles = new List<HearingRoleResponse> {
                new HearingRoleResponse { Name = "b type" },
                new HearingRoleResponse { Name = "z type" },
                new HearingRoleResponse { Name = "d type" },
                new HearingRoleResponse { Name = "a type" },
            };
            _bookingsApiClientMock.Setup(x => x.GetCaseRolesForCaseTypeAsync(It.IsAny<string>())).ReturnsAsync(listTypes);
            _bookingsApiClientMock.Setup(x => x.GetHearingRolesForCaseRoleAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(listHearingRoles);

            var response = await _controller.GetParticipantRoles("type1");
            response.Should().NotBeNull();
            var result = (OkObjectResult)response.Result;
            List<CaseAndHearingRolesResponse> caseRoles = (List<CaseAndHearingRolesResponse>)result.Value;
            caseRoles[0].Name.Should().Be("type1");
            caseRoles[0].HearingRoles.Count.Should().Be(4);
            caseRoles[0].HearingRoles.Should().BeInAscendingOrder();
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

        private void SetTestCase(List<CaseRoleResponse> listTypes)
        {
            var listHearingRoles = new List<HearingRoleResponse> { new HearingRoleResponse { Name = "type1" } };

            _userIdentityMock.Setup(x => x.GetAdministratorCaseTypes()).Returns(new List<string> { "type1", "type2" });
            _bookingsApiClientMock.Setup(x => x.GetCaseRolesForCaseTypeAsync(It.IsAny<string>())).ReturnsAsync(listTypes);
            _bookingsApiClientMock.Setup(x => x.GetHearingRolesForCaseRoleAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(listHearingRoles);

        }
    }
}
