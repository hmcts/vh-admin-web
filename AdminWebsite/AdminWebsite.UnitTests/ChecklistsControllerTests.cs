using System.Threading.Tasks;
using AdminWebsite.Controllers;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests
{
    public class ChecklistsControllerTests
    {
        private Mock<IBookingsApiClient> _checklistService;
        private ChecklistsController _controller;
        private Mock<IUserIdentity> _userIdentity;

        [SetUp]
        public void Setup()
        {
            _checklistService = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _controller = new ChecklistsController(_checklistService.Object, _userIdentity.Object);
        }

        //[Test]
        //public async Task should_pass_through_any_data_from_api()
        //{
        //    const int page = 2, pageSize = 10;
        //    var response = new ChecklistsResponse();
        //    _checklistService.Setup(x => x.GetAllParticipantsChecklistsAsync(pageSize ,page)).ReturnsAsync(response);
        //    _userIdentity.Setup(x => x.IsVhOfficerAdministratorRole()).Returns(true);

        //    var actionResult = (OkObjectResult) (await _controller.GetAllParticipantsChecklists(pageSize, page));

        //    actionResult.Value.Should().BeSameAs(response);
        //}

        //[Test]
        //public async Task should_pass_through_relative_next_and_prev_urls_from_api()
        //{
        //    const int page = 2, pageSize = 10;
        //    var response = new ChecklistsResponse
        //    {
        //        Next_page_url = "next",
        //        Prev_page_url = "prev"
        //    };
        //    _checklistService.Setup(x => x.GetAllParticipantsChecklistsAsync(pageSize, page)).ReturnsAsync(response);
        //    _userIdentity.Setup(x => x.IsVhOfficerAdministratorRole()).Returns(true);

        //    var actionResult = (OkObjectResult)(await _controller.GetAllParticipantsChecklists(pageSize, page));

        //    var actualResponse = (ChecklistsResponse) actionResult.Value;
        //    actualResponse.Next_page_url.Should().Be(response.Next_page_url);
        //    actualResponse.Prev_page_url.Should().Be(response.Prev_page_url);
        //}
    }
}