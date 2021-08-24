using AdminWebsite.Controllers;
using AdminWebsite.UnitTests.Helper;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace AdminWebsite.UnitTests.Controllers
{

    public class StaffMemberControllerTest
    {
        private StaffMemberController _controller;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private List<PersonResponse> _response;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();

            _controller = new StaffMemberController(_bookingsApiClient.Object);

            _response = new List<PersonResponse>
            {
                new PersonResponse
                {
                  Id = Guid.NewGuid(),
                  ContactEmail = "adoman@hmcts.net",
                  FirstName = "Adam",
                  LastName = "Mann",
                  TelephoneNumber ="111222333",
                  Title = "Ms",
                  MiddleNames = "No",
                  Username = "adoman@hmcts.net"
                }
            };

        }

        [Test]
        public async Task GetStaffMembersBySearchTerm_Returns_StaffMembers_WhenMatch_SearchTerm()
        {
            _response.Add(new PersonResponse
            {
                Id = Guid.NewGuid(),
                ContactEmail = "",
                FirstName = "Jack",
                LastName = "Mann",
                TelephoneNumber = "",
                Title = "Mr",
                MiddleNames = "No",
                Username = "jackman@judiciary.net"
            });
            _bookingsApiClient.Setup(x => x.GetStaffMemberBySearchTermAsync(It.IsAny<string>()))
                              .ReturnsAsync(_response);

            var searchTerm = "ado";
            var result = await _controller.GetStaffMembersBySearchTerm(searchTerm);

            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
            var personRespList = (List<PersonResponse>)okRequestResult.Value;
            personRespList.Count.Should().Be(_response.Count);
            personRespList[1].Username.Should().Be(_response[1].Username);
        }

        [Test]
        public async Task GetStaffMembersBySearchTerm_Returns_BadRequest_When_BookingsApiReturns_BadRequest()
        {
            _bookingsApiClient.Setup(x => x.GetStaffMemberBySearchTermAsync(It.IsAny<string>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var response = await _controller.GetStaffMembersBySearchTerm("term");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public async Task GetStaffMembersBySearchTerm_When_SearchTerm_Lessthan_3_Char_BadRequest()
        {
            var response = await _controller.GetStaffMembersBySearchTerm("te");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }
    }
}
