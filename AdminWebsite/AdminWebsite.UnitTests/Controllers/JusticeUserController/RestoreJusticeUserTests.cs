using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Controllers;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers.JusticeUserController
{
    public class RestoreJusticeUserTests
    {
        private JusticeUsersController _sut;
        private AutoMock _mocker;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _sut = SetUpController();
        }

        private JusticeUsersController SetUpController()
        {
            var controller = _mocker.Create<JusticeUsersController>();
            return controller;
        }
        
        [Test]
        public async Task should_restore_justice_user_and_forward_request_to_api()
        {
            // Arrange
            var request = Builder<RestoreJusticeUserRequest>.CreateNew().Build();
            var expectedResponse = Builder<JusticeUserResponse>.CreateNew()
                .With(x => x.Id, request.Id)
                .Build();
            
            var bookingsApiClient = _mocker.Mock<IBookingsApiClient>();
            bookingsApiClient
                .Setup(x => x.RestoreJusticeUserAsync(It.IsAny<RestoreJusticeUserRequest>()))
                .Returns(Task.FromResult(expectedResponse));

            // Act
            var result = await _sut.RestoreJusticeUser(request);

            // Assert
            bookingsApiClient.Verify(x => x.RestoreJusticeUserAsync(request), Times.Once);
            result.Should().BeOfType<NoContentResult>();
        }

        [Test]
        public async Task should_forward_not_found_from_bookings_api_to_client_app()
        {
            // Arrange
            var id = Guid.NewGuid();
            var errorMessage = $"Justice user with id {id} not found";
            var apiException = new BookingsApiException<string>("NotFound", 
                (int)HttpStatusCode.NotFound,
                "NotFound",
                null,
                errorMessage,
                null);
            var bookingsApiClient = _mocker.Mock<IBookingsApiClient>();
            bookingsApiClient.Setup(x => x.RestoreJusticeUserAsync(It.IsAny<RestoreJusticeUserRequest>())).ThrowsAsync(apiException);
            
            var request = new RestoreJusticeUserRequest();
            
            // Act
            var result = await _sut.RestoreJusticeUser(request);
            
            // Assert
            result.Should().BeOfType<NotFoundObjectResult>().And.Subject.As<NotFoundObjectResult>().Value.Should()
                .Be(errorMessage);
        }

        [Test]
        public async Task should_forward_bad_request_from_bookings_api_to_client_app()
        {
            // Arrange
            var id = Guid.Empty;
            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {"id", new[] {"Please provide a valid id"}}
            });
            var apiException = new BookingsApiException<ValidationProblemDetails>("BadRequest", 
                (int)HttpStatusCode.BadRequest,
                "Please provide a valid id",
                null,
                validationProblemDetails,
                null);
            var bookingsApiClient = _mocker.Mock<IBookingsApiClient>();
            bookingsApiClient.Setup(x => x.RestoreJusticeUserAsync(It.IsAny<RestoreJusticeUserRequest>())).ThrowsAsync(apiException);
            
            var request = new RestoreJusticeUserRequest();
            
            // Act
            var result = await _sut.RestoreJusticeUser(request);
            
            // Assert
            result.Should().BeOfType<BadRequestObjectResult>().And.Subject.As<BadRequestObjectResult>().Value.Should()
                .Be(validationProblemDetails);
        }

        [Test]
        public void should_forward_unhandled_error_from_bookings_api_to_client_app()
        {
            // Arrange
            var id = Guid.NewGuid();
            var errorMessage = "Unexpected error for unit test";
            var apiException = new BookingsApiException<string>("Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Server Error", null, errorMessage, null);
            var bookingsApiClient = _mocker.Mock<IBookingsApiClient>();

            bookingsApiClient.Setup(x => x.RestoreJusticeUserAsync(It.IsAny<RestoreJusticeUserRequest>()))
                .ThrowsAsync(apiException);

            var request = new RestoreJusticeUserRequest();
            
            // Act & Assert
            Assert.ThrowsAsync<BookingsApiException<string>>(async () => await _sut.RestoreJusticeUser(request)).Result
                .Should().Be(errorMessage);
        }
    }
}
