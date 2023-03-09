using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Controllers;
using AdminWebsite.Models;
using AdminWebsite.Testing.Common.Builders;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers.JusticeUserController
{
    public class EditJusticeUserTests
    {
        private JusticeUsersController _sut;
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _sut = SetupController();
        }       

        private JusticeUsersController SetupController()
        {
            var controller = _mocker.Create<JusticeUsersController>();
            return controller;
        }

        [Test]
        public async Task should_add_edited_user_to_request_as_ok_and_forward_request_to_api()
        {
            // arrange
            var request = Builder<EditJusticeUserRequest>.CreateNew().Build();
            var expectedResponse = Builder<JusticeUserResponse>.CreateNew()
                .With(x => x.Id, request.Id)
                .Build();
            var bookingsApiClient = _mocker.Mock<IBookingsApiClient>();
            bookingsApiClient.Setup(x => x.EditJusticeUserAsync(It.IsAny<EditJusticeUserRequest>()))
                .ReturnsAsync(expectedResponse);

            // act
            var result = await _sut.EditJusticeUser(request);

            // assert
            bookingsApiClient.Verify(x =>
                x.EditJusticeUserAsync(It.Is<EditJusticeUserRequest>(r => r.Id == expectedResponse.Id)), Times.Once());
            result.Should().BeOfType<OkObjectResult>().And.Subject.As<OkObjectResult>().Value.Should()
                .Be(expectedResponse);
        }

        [Test]
        public async Task should_forward_bad_request_from_bookings_api_to_client_app()
        {
            // arrange
            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {"FirstName", new[] {"First name is required"}},
                {"LastName", new[] {"Last name is required"}}
            });

            var apiException = new BookingsApiException<ValidationProblemDetails>("BadRequest",
                (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, validationProblemDetails, null);
            var bookingsApiClient = _mocker.Mock<IBookingsApiClient>();
            bookingsApiClient.Setup(x => x.EditJusticeUserAsync(It.IsAny<EditJusticeUserRequest>()))
                .ThrowsAsync(apiException);

            var request = new EditJusticeUserRequest();

            // act
            var result = await _sut.EditJusticeUser(request);

            // assert
            result.Should().BeOfType<BadRequestObjectResult>().And.Subject.As<BadRequestObjectResult>().Value.Should()
                .Be(validationProblemDetails);
        }

        [Test]
        public void should_forward_unhandled_error_from_bookings_api_to_client_app()
        {
            // arrange
            var errorMessage = "Unexpected error for unit test";
            var apiException = new BookingsApiException<string>("Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Server Error", null, errorMessage, null);
            var bookingsApiClient = _mocker.Mock<IBookingsApiClient>();
            bookingsApiClient.Setup(x => x.EditJusticeUserAsync(It.IsAny<EditJusticeUserRequest>()))
                .ThrowsAsync(apiException);

            var request = new EditJusticeUserRequest();

            // act & assert
            Assert.ThrowsAsync<BookingsApiException<string>>(async () => await _sut.EditJusticeUser(request)).Result
                .Should().Be(errorMessage);
        }
    }
}