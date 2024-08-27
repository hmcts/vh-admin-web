using System.Threading;
using System.Threading.Tasks;
using AdminWebsite.Controllers;
using AdminWebsite.Services;
using BookingsApi.Contract.V2.Responses;
using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.UnitTests.Controllers
{
    public class HearingRolesControllerTests
    {
        private Mock<IReferenceDataService> _referenceDataService;
        private HearingRolesController _controller;

        [SetUp]
        public void Setup()
        {
            _referenceDataService = new Mock<IReferenceDataService>();
            _controller = new HearingRolesController(_referenceDataService.Object);
        }
        
        [Test]
        public async Task Should_return_list_of_hearing_roles()
        {
            // Arrange
            var roles = new List<HearingRoleResponseV2>
            {
                new()
                {
                    Code = "APPL",
                    Name = "Applicant",
                    UserRole = "Individual"
                },
                new()
                {
                    Code = "JUDG",
                    Name = "Judge",
                    UserRole = "Judge"
                },
                new()
                {
                    Code = "PANL",
                    Name = "Panel Member",
                    UserRole = "Judicial Office Holder"
                }
            };
            
            _referenceDataService.Setup(x => x.GetHearingRolesAsync(CancellationToken.None)).ReturnsAsync(roles);
            
            // Act
            var response = await _controller.GetHearingRoles(CancellationToken.None);

            // Assert
            var okResult = (OkObjectResult)response;
            okResult.StatusCode.Should().Be(200);
            okResult.Value.Should().BeEquivalentTo(roles);
        }
    }
}
