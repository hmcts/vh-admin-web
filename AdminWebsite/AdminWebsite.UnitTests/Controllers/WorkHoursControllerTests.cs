using AdminWebsite.Controllers;
using AdminWebsite.Models;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AdminWebsite.UnitTests.Controllers
{
    public class WorkHoursControllerTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClientMock;

        private List<string> _failedUsernames;

        private WorkHoursController _controller;

        [SetUp]
        public void Setup()
        {
            _failedUsernames = new List<string>();

            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _bookingsApiClientMock.Setup(x => x.SaveWorkHoursAsync(It.IsAny<List<UploadWorkHoursRequest>>()))
                .ReturnsAsync(_failedUsernames);
            _bookingsApiClientMock.Setup(x => x.SaveNonWorkingHoursAsync(It.IsAny<List<UploadNonWorkingHoursRequest>>()))
                .ReturnsAsync(_failedUsernames);

            _controller = new WorkHoursController(_bookingsApiClientMock.Object);
        }

        [Test]
        public async Task UploadWorkHours_should_call_api_and_return_failed_usernames()
        {
            // Arrange
            var request = new List<UploadWorkHoursRequest>();
            _failedUsernames.Add("failedusername@test.com");

            // Act
            var response = (await _controller.UploadWorkHours(request)) as OkObjectResult;

            // Assert
            _bookingsApiClientMock.Verify(x => x.SaveWorkHoursAsync(request), Times.Once);
            Assert.AreEqual(_failedUsernames, (response.Value as UploadWorkHoursResponse).FailedUsernames);
        }

        [Test]
        public async Task UploadNonWorkingHours_should_call_api_and_return_failed_usernames()
        {
            // Arrange
            var request = new List<UploadNonWorkingHoursRequest>();
            _failedUsernames.Add("failedusername@test.com");

            // Act
            var response = (await _controller.UploadNonWorkingHours(request)) as OkObjectResult;

            // Assert
            _bookingsApiClientMock.Verify(x => x.SaveNonWorkingHoursAsync(request), Times.Once);
            Assert.AreEqual(_failedUsernames, (response.Value as UploadNonWorkingHoursResponse).FailedUsernames);
        }
    }
}