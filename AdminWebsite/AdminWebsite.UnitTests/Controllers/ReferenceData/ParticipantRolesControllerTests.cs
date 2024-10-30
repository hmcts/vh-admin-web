using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Controllers.ReferenceData;
using AdminWebsite.Models;
using AdminWebsite.Security;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.Interfaces.Response;
using BookingsApi.Contract.V2.Responses;
using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.UnitTests.Controllers.ReferenceData
{
    public class ParticipantRolesControllerTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        private Mock<IUserIdentity> _userIdentityMock;
        private ParticipantRolesController _controller;
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _bookingsApiClientMock = _mocker.Mock<IBookingsApiClient>();
            _userIdentityMock = _mocker.Mock<IUserIdentity>();
            _controller = _mocker.Create<ParticipantRolesController>();
        }

        [Test]
        public async Task Should_return_participants_roles()
        {
            List<ICaseRoleResponse> listTypes;
            listTypes = new List<ICaseRoleResponse> { new CaseRoleResponseV2 { Name = "type1" } };
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
            var listTypes = new List<ICaseRoleResponse>();
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
            List<ICaseRoleResponse> listTypes = null;
            SetTestCase(listTypes);

            var response = await _controller.GetParticipantRoles("type1");
            response.Should().NotBeNull();
            var result = (OkObjectResult)response.Result;
            List<CaseAndHearingRolesResponse> caseRoles = (List<CaseAndHearingRolesResponse>)result.Value;
            caseRoles.Count.Should().Be(0);
        }

        private void SetTestCase(List<ICaseRoleResponse> listTypes)
        {
            var listHearingRoles2 = new List<HearingRoleResponseV2> { new HearingRoleResponseV2 { Name = "type1", UserRole = "role1"} };

            _userIdentityMock.Setup(x => x.GetAdministratorCaseTypes()).Returns(new List<string> { "type1", "type2" });
            
            //v2 endpoints
            var casetypeV2Response = listTypes?.Select(e => (CaseRoleResponseV2)e).ToList();
            _bookingsApiClientMock.Setup(x => x.GetCaseRolesForCaseServiceAsync(It.IsAny<string>())).ReturnsAsync(casetypeV2Response);
            _bookingsApiClientMock.Setup(x => x.GetHearingRolesForCaseRoleV2Async(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(listHearingRoles2);
            
        }
    }
}
