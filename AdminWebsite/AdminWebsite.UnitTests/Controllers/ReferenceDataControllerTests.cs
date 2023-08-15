﻿using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using AdminWebsite.Controllers;
using AdminWebsite.Models;
using AdminWebsite.Security;
using BookingsApi.Client;
using BookingsApi.Contract.Responses;
using HearingTypeResponse = BookingsApi.Contract.Responses.HearingTypeResponse;

namespace AdminWebsite.UnitTests.Controllers
{
    public class ReferenceDataControllerTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        private Mock<IUserIdentity> _userIdentityMock;
        private ReferenceDataController _controller;
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _bookingsApiClientMock = _mocker.Mock<IBookingsApiClient>();
            _userIdentityMock = _mocker.Mock<IUserIdentity>();
            _controller = _mocker.Create<ReferenceDataController>();
        }

        [Test]
        public void Should_return_a_list_of_venues()
        {
            var hearingVenues = Builder<HearingVenueResponse>.CreateListOfSize(2).Build().ToList();
            _bookingsApiClientMock.Setup(x => x.GetHearingVenuesAsync(true)).ReturnsAsync(hearingVenues);

            var response = _controller.GetCourts();
            var result = (OkObjectResult)response.Result.Result;
            result.Value.Should().Be(hearingVenues);
        }

        [Test]
        public async Task Should_return_all_hearing_types()
        {
            // Arrange
            var includeDeleted = true;
            _userIdentityMock.Setup(x => x.IsAdministratorRole()).Returns(true);
            _bookingsApiClientMock.Setup(x =>
                    x.GetCaseTypesAsync(includeDeleted))
                    .ReturnsAsync(GetCaseTypesList());

            // Act
            var result = await _controller.GetHearingTypes(includeDeleted);

            // Assert
            var okObjectResult = result.Result.Should().BeAssignableTo<OkObjectResult>().Which;
            okObjectResult.Value.Should().BeEquivalentTo(GetHearingTypes());
            _bookingsApiClientMock.Verify(x => x.GetCaseTypesAsync(includeDeleted), Times.Once);
        }

        [Test]
        public async Task Should_return_participants_roles()
        {
            var listTypes = new List<CaseRoleResponse> { new CaseRoleResponse { Name = "type1" } };
            SetTestCase(listTypes);

            var response = await _controller.GetParticipantRoles("type1");
            response.Should().NotBeNull();
            var result = (OkObjectResult)response.Result;
            var caseRoles = (List<CaseAndHearingRolesResponse>)result.Value;
            caseRoles[0].Name.Should().Be("type1");
            caseRoles[0].HearingRoles.Should().NotBeNull();
            caseRoles[0].HearingRoles.Count().Should().Be(1);
            caseRoles[0].HearingRoles.First().Name.Should().Be("type1");
            caseRoles[0].HearingRoles.First().UserRole.Should().Be("role1");
        }

        [Test]
        public async Task Should_return_empty_list_of_participants_roles()
        {
            var listTypes = new List<CaseRoleResponse>();
            SetTestCase(listTypes);

            var response = await _controller.GetParticipantRoles("type1");
            response.Should().NotBeNull();
            var result = (OkObjectResult)response.Result;
            List<CaseAndHearingRolesResponse> caseRoles = (List<CaseAndHearingRolesResponse>)result.Value;
            caseRoles.Count.Should().Be(0);
        }

        [Test]
        public async Task Should_return_empty_list_of_participants_roles_if_list_types_is_null()
        {
            List<CaseRoleResponse> listTypes = null;
            SetTestCase(listTypes);

            var response = await _controller.GetParticipantRoles("type1");
            response.Should().NotBeNull();
            var result = (OkObjectResult)response.Result;
            List<CaseAndHearingRolesResponse> caseRoles = (List<CaseAndHearingRolesResponse>)result.Value;
            caseRoles.Count.Should().Be(0);
        }

        private void SetTestCase(List<CaseRoleResponse> listTypes)
        {
            var listHearingRoles = new List<HearingRoleResponse> { new HearingRoleResponse { Name = "type1", UserRole = "role1"} };

            _userIdentityMock.Setup(x => x.GetAdministratorCaseTypes()).Returns(new List<string> { "type1", "type2" });
            _bookingsApiClientMock.Setup(x => x.GetCaseRolesForCaseTypeAsync(It.IsAny<string>())).ReturnsAsync(listTypes);
            _bookingsApiClientMock.Setup(x => x.GetHearingRolesForCaseRoleAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(listHearingRoles);
        }

        private List<CaseTypeResponse> GetCaseTypesList()
        {
            return new List<CaseTypeResponse>
            {
                new CaseTypeResponse
                {
                    Id = 1, Name = "type1",
                    HearingTypes = new List<HearingTypeResponse>()
                    {
                        new HearingTypeResponse() {Id = 10, Name = "HType10"},
                    }
                },
                new CaseTypeResponse
                {
                    Id = 2, Name = "type2",
                    HearingTypes = new List<HearingTypeResponse>()
                    {
                        new HearingTypeResponse() {Id = 20, Name = "HType20"},
                    }
                },
                new CaseTypeResponse
                {
                    Id = 3, Name = "type3",
                     HearingTypes = new List<HearingTypeResponse>()
                    {
                        new HearingTypeResponse() {Id = 25, Name = "HType25"},
                        new HearingTypeResponse() {Id = 29, Name = "HType29"},
                    }
                }
            };
        }

        private List<HearingTypeResponse> GetHearingTypes()
        {
            var result = new List<HearingTypeResponse>()
            {
                new HearingTypeResponse() {Id = 10, Name = "HType10"},
                new HearingTypeResponse() {Id = 20, Name = "HType20"},
                new HearingTypeResponse() {Id = 25, Name = "HType25"},
                new HearingTypeResponse() {Id = 29, Name = "HType29"}
            };
            return result;
        }
    }
}
