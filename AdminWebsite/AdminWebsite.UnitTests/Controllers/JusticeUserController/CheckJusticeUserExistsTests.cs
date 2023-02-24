using System;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Controllers;
using AdminWebsite.Models;
using AdminWebsite.Testing.Common.Builders;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using UserApi.Client;
using UserApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.JusticeUserController
{
    public class CheckJusticeUserExistsTests
    {
        private JusticeUsersController _sut;
        private AutoMock _mocker;
        private readonly string _loggedInUserUsername = "test.vho@hmcts.net";
        
        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _sut = SetupControllerWithClaims();
        }

        [Test]
        public async Task should_return_an_existing_user_if_account_is_found_by_user_api()
        {
            // arrange
            var usernameToCheck = "foo@test.com";
            var existingUser = Builder<UserProfile>.CreateNew()
                .With(x => x.UserId, Guid.NewGuid().ToString())
                .With(x => x.UserName, usernameToCheck)
                .With(x => x.Email, "personal@email.com")
                .Build();
            var expectedResponseDto = new ExistingJusticeUserResponse
            {
                Username = existingUser.UserName,
                FirstName = existingUser.FirstName,
                LastName = existingUser.LastName,
                Telephone = existingUser.TelephoneNumber,
                ContactEmail = existingUser.Email
            };
            
            var userApiClient = _mocker.Mock<IUserApiClient>();
            userApiClient.Setup(x => x.GetUserByAdUserNameAsync(usernameToCheck)).ReturnsAsync(existingUser);
            
            // act
            var result = await _sut.CheckJusticeUserExists(usernameToCheck);
            
            // assert
            result.Result.Should().BeOfType<OkObjectResult>().And.Subject.As<OkObjectResult>().Value.Should().BeEquivalentTo(expectedResponseDto);

        }

        [Test]
        public async Task should_forward_not_found_from_user_api_to_client_app()
        {
            // arrange
            var usernameToCheck = "foo@test.com";
            var errorMessage = "A user account with the given username does not exist";
            var apiException = new UserApiException<string>("NotFound", (int) HttpStatusCode.NotFound,
                "NotFound", null, errorMessage, null);
            var userApiClient = _mocker.Mock<IUserApiClient>();
            userApiClient.Setup(x => x.GetUserByAdUserNameAsync(usernameToCheck)).ThrowsAsync(apiException);
            
            // act
            var result = await _sut.CheckJusticeUserExists(usernameToCheck);
            
            // assert
            result.Result.Should().BeOfType<NotFoundObjectResult>().And.Subject.As<NotFoundObjectResult>().Value
                .As<string>().Should().Contain("Username could not be found");
        }
        
        [Test]
        public void should_forward_unhandled_error_from_user_api_to_client_app()
        {
            // arrange
            var usernameToCheck = "foo@test.com";
            var errorMessage = "Unexpected error for unit test";
            var apiException = new UserApiException<string>("Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Server Error", null, errorMessage, null);
            var userApiClient = _mocker.Mock<IUserApiClient>();
            userApiClient.Setup(x => x.GetUserByAdUserNameAsync(usernameToCheck)).ThrowsAsync(apiException);


            // act & assert
            Assert.ThrowsAsync<UserApiException<string>>(async () => await _sut.CheckJusticeUserExists(usernameToCheck)).Result
                .Should().Be(errorMessage);
        }
        
        private JusticeUsersController SetupControllerWithClaims()
        {
            var cp = new ClaimsPrincipalBuilder().WithRole(AppRoles.VhOfficerRole)
                .WithUsername(_loggedInUserUsername).Build();
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
    }
}