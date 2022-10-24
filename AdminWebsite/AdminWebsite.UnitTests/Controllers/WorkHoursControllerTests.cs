using System;
using AdminWebsite.Controllers;
using AdminWebsite.Models;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Contract.Responses;
using FluentAssertions;

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
        
        [Test]
        public async Task Should_call_GetWorkhours_and_return_Ok()
        {
            // Arrange
            var username = "test.user@hmcts.net";
            _bookingsApiClientMock
                .Setup(e => e.GetVhoWorkAvailabilityHoursAsync(username))
                .ReturnsAsync(new List<VhoWorkHoursResponse>());

            // Act
            var response = (await _controller.GetWorkAvailabilityHours(username)) as OkObjectResult;

            // Assert
            _bookingsApiClientMock.Verify(x => x.GetVhoWorkAvailabilityHoursAsync(username), Times.Once);
            response.Value.Should().BeOfType<List<VhoWorkHoursResponse>>();
        }   
        
        [Test]
        public async Task Should_call_GetWorkhours_and_return_NotFound()
        {
            // Arrange
  
            var username = "test.user@hmcts.net";
            _bookingsApiClientMock
                .Setup(e => e.GetVhoWorkAvailabilityHoursAsync(username))
                .Throws(new BookingsApiException("error",404,"",new Dictionary<string, IEnumerable<string>>(), new Exception()));


            // Act
            var response = await _controller.GetWorkAvailabilityHours(username);

            // Assert
            _bookingsApiClientMock.Verify(x => x.GetVhoWorkAvailabilityHoursAsync(username), Times.Once);
            
            response.Should().NotBeNull();

            var objectResult = (NotFoundObjectResult)response;
            objectResult.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
        }      
        
        [Test]
        public async Task Should_call_GetWorkhours_and_return_BadRequest()
        {
            // Arrange
  
            var username = "test.user@hmcts.net";
            _bookingsApiClientMock
                .Setup(e => e.GetVhoWorkAvailabilityHoursAsync(username))
                .Throws(new BookingsApiException("error",400,"",new Dictionary<string, IEnumerable<string>>(), new Exception()));


            // Act
            var response = await _controller.GetWorkAvailabilityHours(username);

            // Assert
            _bookingsApiClientMock.Verify(x => x.GetVhoWorkAvailabilityHoursAsync(username), Times.Once);
            
            response.Should().NotBeNull();

            var objectResult = (BadRequestObjectResult)response;
            objectResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }  
        [Test]
        public async Task Should_call_GetNonAvailability_and_return_Ok()
        {
            // Arrange
            var username = "test.user@hmcts.net";
            _bookingsApiClientMock
                .Setup(e => e.GetVhoNonAvailabilityHoursAsync(username))
                .ReturnsAsync(new List<VhoNonAvailabilityWorkHoursResponse>());

            // Act
            var response = (await _controller.GetNonAvailabilityWorkHours(username)) as OkObjectResult;

            // Assert
            _bookingsApiClientMock.Verify(x => x.GetVhoNonAvailabilityHoursAsync(username), Times.Once);
            response.Value.Should().BeOfType<List<VhoNonAvailabilityWorkHoursResponse>>();
        }   
        
        [Test]
        public async Task Should_call_GetNonAvailability_and_return_NotFound()
        {
            // Arrange
  
            var username = "test.user@hmcts.net";
            _bookingsApiClientMock
                .Setup(e => e.GetVhoNonAvailabilityHoursAsync(username))
                .Throws(new BookingsApiException("error",404,"",new Dictionary<string, IEnumerable<string>>(), new Exception()));


            // Act
            var response = await _controller.GetNonAvailabilityWorkHours(username);

            // Assert
            _bookingsApiClientMock.Verify(x => x.GetVhoNonAvailabilityHoursAsync(username), Times.Once);
            
            response.Should().NotBeNull();

            var objectResult = (NotFoundObjectResult)response;
            objectResult.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
        }      
        
        [Test]
        public async Task Should_call_GetNonAvailability_and_return_BadRequest()
        {
            // Arrange
  
            var username = "test.user@hmcts.net";
            _bookingsApiClientMock
                .Setup(e => e.GetVhoNonAvailabilityHoursAsync(username))
                .Throws(new BookingsApiException("error",400,"",new Dictionary<string, IEnumerable<string>>(), new Exception()));


            // Act
            var response = await _controller.GetNonAvailabilityWorkHours(username);

            // Assert
            _bookingsApiClientMock.Verify(x => x.GetVhoNonAvailabilityHoursAsync(username), Times.Once);
            
            response.Should().NotBeNull();

            var objectResult = (BadRequestObjectResult)response;
            objectResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
    }
}