using System.Threading;
using System.Threading.Tasks;
using AdminWebsite.Controllers.ReferenceData;
using AdminWebsite.Security;
using AdminWebsite.Services;
using Autofac.Extras.Moq;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Mvc;
using HearingTypeResponse = BookingsApi.Contract.V1.Responses.HearingTypeResponse;

namespace AdminWebsite.UnitTests.Controllers.ReferenceData
{
    public class HearingTypesControllerTests
    {
        private Mock<IReferenceDataService> _referenceDataServiceMock;
        private Mock<IUserIdentity> _userIdentityMock;
        private HearingTypesController _controller;
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _userIdentityMock = _mocker.Mock<IUserIdentity>();
            _referenceDataServiceMock = _mocker.Mock<IReferenceDataService>();
            _controller = _mocker.Create<HearingTypesController>();
        }

        [Test]
        public async Task Should_return_all_hearing_types_and_case_types_where_hearing_type_is_empty()
        {
            // Arrange
            var includeDeleted = true;
            _userIdentityMock.Setup(x => x.IsATeamLead())
                .Returns(true);
            _referenceDataServiceMock.Setup(x =>
                    x.GetNonDeletedCaseTypesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(GetCaseTypesList());

            // Act
            var result = await _controller.GetHearingTypes(includeDeleted);

            // Assert
            var okObjectResult = result.Result.Should().BeAssignableTo<OkObjectResult>().Which;
            okObjectResult.Value.Should().BeEquivalentTo(GetHearingTypes());
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
