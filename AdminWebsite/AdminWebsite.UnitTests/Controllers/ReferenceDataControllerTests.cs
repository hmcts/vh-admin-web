using System.Linq;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.Mvc;
using AdminWebsite.Controllers;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Security;
using BookingsApi.Client;
using BookingsApi.Contract.Interfaces.Response;
using BookingsApi.Contract.V1.Enums;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Responses;
using HearingTypeResponse = BookingsApi.Contract.V1.Responses.HearingTypeResponse;

namespace AdminWebsite.UnitTests.Controllers
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
            _bookingsApiClientMock.Setup(x => x.GetHearingVenuesAsync(true)).ReturnsAsync(hearingVenues);

            var response = _controller.GetCourts();
            var result = (OkObjectResult)response.Result.Result;
            result.Value.Should().Be(hearingVenues);
        }

        [Test]
        public async Task Should_return_all_hearing_types_and_case_types_where_hearing_type_is_empty()
        {
            // Arrange
            var includeDeleted = true;
            _userIdentityMock.Setup(x => x.IsATeamLead())
                .Returns(true);
            _bookingsApiClientMock.Setup(x =>
                    x.GetCaseTypesAsync(includeDeleted))
                .ReturnsAsync(GetCaseTypesList());

            // Act
            var result = await _controller.GetHearingTypes(includeDeleted);

            // Assert
            var okObjectResult = result.Result.Should().BeAssignableTo<OkObjectResult>().Which;
            okObjectResult.Value.Should().BeEquivalentTo(GetHearingTypes());
            _bookingsApiClientMock.Verify(x => x.GetCaseTypesAsync(includeDeleted), Times.Once);
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

        [Test]
        public async Task should_return_list_of_available_languages()
        {
            // Arrange
            var languages = new List<InterpreterLanguagesResponse>
            {
                new()
                {
                    Code = "en", Value = "English", WelshValue = "Saesneg", Type = InterpreterType.Verbal, Live = true
                },
                new()
                {
                    Code = "cy", Value = "Welsh", WelshValue = "Cymraeg", Type = InterpreterType.Verbal, Live = true
                },
                new()
                {
                    Code = "fr", Value = "French", WelshValue = "Ffrangeg", Type = InterpreterType.Verbal, Live = true
                },
                new()
                {
                    Code = "bsl", Value = "British Sign Language", WelshValue = "Iaith Arwyddion Prydain",
                    Type = InterpreterType.Sign, Live = true
                },
                new()
                {
                    Code = "isl", Value = "Icelandic Sign Language", WelshValue = "Iaith Arwyddion Gwlad yr Iâ",
                    Type = InterpreterType.Sign, Live = true
                },
            };

            var expected = languages.Select(AvailableLanguageResponseMapper.Map).ToList();
            _bookingsApiClientMock.Setup(x => x.GetAvailableInterpreterLanguagesAsync()).ReturnsAsync(languages);
            
            
            // Act
            var result = await _controller.GetAvailableLanguages();
            
            // Assert
            var okObjectResult = result.Result.Should().BeAssignableTo<OkObjectResult>().Which;
            okObjectResult.Value.Should().BeEquivalentTo(expected);
        }
        private static List<CaseTypeResponse> GetCaseTypesList()
        {
            return new List<CaseTypeResponse>
            {
                new ()
                {
                    Id = 1, Name = "type1", ServiceId = "AA1",
                    HearingTypes = new List<HearingTypeResponse>()
                    {
                        new () {Id = 10, Name = "HType10", Code = "Code10"},
                    }
                },
                new()
                {
                    Id = 2, Name = "type2", ServiceId = "AA2",
                    HearingTypes = new List<HearingTypeResponse>()
                    {
                        new () {Id = 20, Name = "HType20", Code = "Code20"},
                    }
                },
                new()
                {
                    Id = 3, Name = "type3", ServiceId = "AA3",
                    HearingTypes = new List<HearingTypeResponse>()
                    {
                        new () {Id = 25, Name = "HType25", Code = "Code25"},
                        new () {Id = 29, Name = "HType29", Code = "Code29"},
                    }
                },
                new()
                {
                    Id = 4, Name = "type4", ServiceId = "AA4",
                    HearingTypes = new List<HearingTypeResponse>()
                }
            };
        }

        private static List<AdminWebsite.Contracts.Responses.HearingTypeResponse> GetHearingTypes()
        {
            var result = new List<AdminWebsite.Contracts.Responses.HearingTypeResponse>()
            {
                new () {Id = 10, Name = "HType10", Group = "type1", ServiceId = "AA1", Code = "Code10"},
                new () {Id = 20, Name = "HType20", Group = "type2", ServiceId = "AA2", Code = "Code20"},
                new () {Id = 25, Name = "HType25", Group = "type3", ServiceId = "AA3", Code = "Code25"},
                new () {Id = 29, Name = "HType29", Group = "type3", ServiceId = "AA3", Code = "Code29"},
                new () {Group = "type4", ServiceId = "AA4"},
            };
            return result;
        }
    }
}
