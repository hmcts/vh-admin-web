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
    public class AddNewJusticeUserTests
    {
        private JusticeUsersController _sut;
        private AutoMock _mocker;
        private readonly string _username = "test.vho@hmcts.net";

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _sut = SetupControllerWithClaims();
        }

        private JusticeUsersController SetupControllerWithClaims()
        {
            var cp = new ClaimsPrincipalBuilder().WithRole(AppRoles.VhOfficerRole)
                .WithUsername(_username).Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = cp
                }
            };

            var controller = _mocker.Create<JusticeUsersController>();
            controller.ControllerContext = context;
            return controller;
        }

        [Test]
        public async Task should_add_current_user_to_request_as_createdby_and_forward_request_to_api()
        {
            // arrange
            var request = Builder<AddJusticeUserRequest>.CreateNew().Build();
            var expectedResponse = Builder<JusticeUserResponse>.CreateNew()
                .With(x => x.CreatedBy, _username)
                .With(x => x.Id, Guid.NewGuid())
                .Build();
            var bookingsApiClient = _mocker.Mock<IBookingsApiClient>();
            bookingsApiClient.Setup(x => x.AddAJusticeUserAsync(It.IsAny<AddJusticeUserRequest>()))
                .ReturnsAsync(expectedResponse);

            // act
            var result = await _sut.AddNewJusticeUser(request);

            // assert
            bookingsApiClient.Verify(x =>
                x.AddAJusticeUserAsync(It.Is<AddJusticeUserRequest>(r => r.CreatedBy == _username)), Times.Once());
            result.Should().BeOfType<CreatedResult>().And.Subject.As<CreatedResult>().Value.Should()
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
            bookingsApiClient.Setup(x => x.AddAJusticeUserAsync(It.IsAny<AddJusticeUserRequest>()))
                .ThrowsAsync(apiException);

            var request = new AddJusticeUserRequest();

            // act
            var result = await _sut.AddNewJusticeUser(request);

            // assert
            result.Should().BeOfType<BadRequestObjectResult>().And.Subject.As<BadRequestObjectResult>().Value.Should()
                .Be(validationProblemDetails);
        }

        [Test]
        public async Task should_forward_conflict_from_bookings_api_to_client_app()
        {
            // arrange
            var errorMessage = "A user with the username already exists";
            var apiException = new BookingsApiException<string>("Conflict", (int) HttpStatusCode.Conflict,
                "Conflict", null, errorMessage, null);
            var bookingsApiClient = _mocker.Mock<IBookingsApiClient>();
            bookingsApiClient.Setup(x => x.AddAJusticeUserAsync(It.IsAny<AddJusticeUserRequest>()))
                .ThrowsAsync(apiException);

            var request = new AddJusticeUserRequest();

            // act
            var result = await _sut.AddNewJusticeUser(request);

            // assert
            result.Should().BeOfType<ConflictObjectResult>().And.Subject.As<ConflictObjectResult>().Value.Should()
                .Be(errorMessage);
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
            bookingsApiClient.Setup(x => x.AddAJusticeUserAsync(It.IsAny<AddJusticeUserRequest>()))
                .ThrowsAsync(apiException);

            var request = new AddJusticeUserRequest();

            // act & assert
            Assert.ThrowsAsync<BookingsApiException<string>>(async () => await _sut.AddNewJusticeUser(request)).Result
                .Should().Be(errorMessage);
        }
    }
}