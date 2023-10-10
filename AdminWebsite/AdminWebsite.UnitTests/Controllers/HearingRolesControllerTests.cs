using System.Collections.Generic;
using System.Threading.Tasks;
using AdminWebsite.Controllers;
using BookingsApi.Client;
using BookingsApi.Contract.V2.Responses;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers
{
    public class HearingRolesControllerTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private HearingRolesController _controller;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _controller = new HearingRolesController(_bookingsApiClient.Object);
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
            
            _bookingsApiClient.Setup(x => x.GetHearingRolesAsync()).ReturnsAsync(roles);
            
            // Act
            var response = await _controller.GetHearingRoles();

            // Assert
            var okResult = (OkObjectResult)response;
            okResult.StatusCode.Should().Be(200);
            okResult.Value.Should().BeEquivalentTo(roles);
        }
    }
}
