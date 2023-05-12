using System;
using System.Collections.Generic;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using AdminWebsite.Models;
using AdminWebsite.Services;
using Autofac;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.Requests.Enums;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;
using NUnit.Framework.Internal;

namespace AdminWebsite.UnitTests.Services
{
    public class AppRoleServiceTests
    {
        private AutoMock _mocker;
        private AppRoleService _sut;
        private MemoryCache _cache;

        [SetUp]
        public void Setup()
        {
            _cache = new MemoryCache(new MemoryCacheOptions());
            _mocker = AutoMock.GetLoose(builder => builder.RegisterInstance<IMemoryCache>(_cache));
            _sut = _mocker.Create<AppRoleService>();
        }

        [TestCase(JusticeUserRole.VhTeamLead, AppRoles.VhOfficerRole)]
        [TestCase(JusticeUserRole.Vho, AppRoles.VhOfficerRole)]
        [TestCase(JusticeUserRole.CaseAdmin, AppRoles.CaseAdminRole)]
        [TestCase(JusticeUserRole.Judge, AppRoles.JudgeRole)]
        [TestCase(JusticeUserRole.StaffMember, AppRoles.StaffMember)]
        public async Task should_map_justice_user_role_to_app_role_and_set_cache(
            JusticeUserRole justiceUserRole, string expectedAppRole)
        {
            // arrange
            var username = "random@claims.com";
            var uniqueId = Guid.NewGuid().ToString();
            var justiceUser = new JusticeUserResponse()
            {
                UserRoles = new List<JusticeUserRole>() { justiceUserRole },
                Username = username,
                Deleted = false,
                Id = Guid.NewGuid()
            };
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetJusticeUserByUsernameAsync(username))
                .ReturnsAsync(justiceUser);

            // act
            var claims = await _sut.GetClaimsForUserAsync(uniqueId, username);

            // assert
            claims.Count.Should().Be(1);
            claims[0].Value.Should().Be(expectedAppRole);
            _cache.Get(uniqueId).Should().Be(claims);
        }

        [Test]
        public async Task should_return_an_empty_list_of_claims_if_justice_user_has_no_app_role()
        {
            // arrange
            var justiceUserRole = JusticeUserRole.Individual;
            var username = "random@claims.com";
            var uniqueId = Guid.NewGuid().ToString();
            var justiceUser = new JusticeUserResponse()
            {
                UserRoles = new List<JusticeUserRole>() { justiceUserRole },
                Username = username,
                Deleted = false,
                Id = Guid.NewGuid()
            };
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetJusticeUserByUsernameAsync(username))
                .ReturnsAsync(justiceUser);

            // act
            var claims = await _sut.GetClaimsForUserAsync(uniqueId, username);

            // assert
            claims.Should().BeEmpty();
        }

        [Test]
        public async Task should_retrieve_claims_from_cache_if_key_is_present()
        {
            // arrange
            var username = "random@claims.com";
            var uniqueId = Guid.NewGuid().ToString();
            var existingClaims = new List<Claim>()
            {
                new(ClaimTypes.Role, AppRoles.JudgeRole)
            };
            _cache.Set(uniqueId, existingClaims);

            // act
            var claims = await _sut.GetClaimsForUserAsync(uniqueId, username);

            // assert
            claims.Should().BeEquivalentTo(existingClaims);
            _mocker.Mock<IBookingsApiClient>().Verify(x => x.GetJusticeUserByUsernameAsync(username), Times.Never);
        }

        [Test]
        public async Task should_return_an_empty_list_of_claims_if_no_justice_user_is_found()
        {
            // arrange
            var username = "random@claims.com";
            var uniqueId = Guid.NewGuid().ToString();
            var apiException = new BookingsApiException<string>("Conflict", (int) HttpStatusCode.NotFound,
                "Conflict", null, null, null);
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetJusticeUserByUsernameAsync(username))
                .ThrowsAsync(apiException);

            // act
            var claims = await _sut.GetClaimsForUserAsync(uniqueId, username);

            // assert
            claims.Should().BeEmpty();
        }

    }
}