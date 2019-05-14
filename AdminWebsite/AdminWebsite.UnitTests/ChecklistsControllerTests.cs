using System.Threading.Tasks;
using AdminWebsite.Controllers;
using AdminWebsite.Models;
using AdminWebsite.Security;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests
{
    public class ChecklistsControllerTests
    {
        private ChecklistsController _controller;
        private Mock<IUserIdentity> _userIdentity;

        [SetUp]
        public void Setup()
        {
            _userIdentity = new Mock<IUserIdentity>();
            _controller = new ChecklistsController(_userIdentity.Object);
        }

        [Test]
        public async Task should_return_a_list_of_bookings()
        {
            const int page = 2, pageSize = 10;
            _userIdentity.Setup(x => x.IsVhOfficerAdministratorRole()).Returns(true);

            var actionResult = (OkObjectResult) await _controller.GetAllParticipantsChecklists(pageSize, page);

            var actualResponse = (ChecklistsResponse) actionResult.Value;
            actualResponse.Hearings.Should().NotBeNull();
        }
    }
}