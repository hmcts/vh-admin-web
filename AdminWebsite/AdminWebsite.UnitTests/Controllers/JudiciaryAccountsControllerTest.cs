using System;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using AdminWebsite.Mappers;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Responses;
using UserApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers
{
    public class JudiciaryAccountsControllerTest
    {
        private AdminWebsite.Controllers.JudiciaryAccountsController _controller;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserAccountService> _userAccountService;
        private List<JudiciaryPersonResponse> _judiciaryResponse;
        private List<UserResponse> _userResponses;
        private Mock<IFeatureToggles> _IFeatureFlagMock;

        [SetUp]
        public void Setup()
        {
            _IFeatureFlagMock = new Mock<IFeatureToggles>();
            _IFeatureFlagMock.Setup(x => x.EJudEnabled()).Returns(true);
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userAccountService = new Mock<IUserAccountService>();
            var testSettings = new TestUserSecrets
            {
                TestUsernameStem = "@hmcts.net"
            };

            _controller = new AdminWebsite.Controllers.JudiciaryAccountsController(
                _userAccountService.Object,
                JavaScriptEncoder.Default,
                _bookingsApiClient.Object, 
                Options.Create(testSettings),
                _IFeatureFlagMock.Object);

            _judiciaryResponse = new List<JudiciaryPersonResponse>
            {
                new()
                {
                    FirstName = "Adam",
                    LastName = "Mann",
                    Title = "Ms",
                    Email = "adoman@hmcts.net"
                }
            };

            _userResponses = new List<UserResponse>();
        }

        [Test]
        public async Task Should_return_request_if_match_to_search_term()
        {
            _judiciaryResponse = new List<JudiciaryPersonResponse>
            {
                new()
                {
                    FirstName = "Jack",
                    LastName = "Mann",
                    Title = "Mr",
                    Email = "jackman@judiciary.net"
                }
            };
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                              .ReturnsAsync(_judiciaryResponse);

            var searchTerm = "ado";
            var result = await _controller.SearchForJudiciaryPersonAsync(searchTerm);

            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
            var personRespList = (List<JudiciaryPerson>)okRequestResult.Value;
            personRespList.Count.Should().Be(1);
            personRespList[0].Email.Should().Be(_judiciaryResponse[0].Email);
        }

        [Test]
        public async Task Should_filter_out_judges_found_in_both_aad_and_database()
        {
            _judiciaryResponse.Add(new JudiciaryPersonResponse
            {
                Email = "jackman@judiciary.net",
                FirstName = "Jack",
                LastName = "Mann",
                WorkPhone = "",
                Title = "Mr",
                FullName = "Mr Jack Mann",
                PersonalCode = "12345678"
            });
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                              .ReturnsAsync(_judiciaryResponse);

            _userResponses.Add(new UserResponse
            {
                ContactEmail = "jackman@judiciary.net",
            });
            _userAccountService.Setup(x => x.SearchEjudiciaryJudgesByEmailUserResponse(It.IsAny<string>()))
                              .ReturnsAsync(_userResponses);

            var searchTerm = "ado";
            var result = await _controller.PostJudiciaryPersonBySearchTermAsync(searchTerm);

            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
            var personResponses = (List<PersonResponse>)okRequestResult.Value;
            personResponses.Count.Should().Be(1);
            personResponses[0].ContactEmail.Should().Be(_judiciaryResponse[1].Email);
        }

        [Test]
        public async Task Should_pass_on_bad_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var response = await _controller.SearchForJudiciaryPersonAsync("term");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public void Should_pass_on_exception_request_from_bookings_api()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            Assert.ThrowsAsync<BookingsApiException>(() => _controller.SearchForJudiciaryPersonAsync("term"));
        }

        [Test]
        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public async Task Should_return_judiciary_and_courtroom_accounts_if_match_to_search_term(bool withJudiciary, bool withCourtroom)
        {
            _judiciaryResponse = new List<JudiciaryPersonResponse>
            {
                new()
                {
                    Email = "jackman@judiciary.net",
                    FirstName = "Jack",
                    LastName = "Mann",
                    WorkPhone = "",
                    Title = "Mr",
                    FullName = "Mr Jack Mann",
                    PersonalCode = "12345678"
                }
            };
            
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                              .ReturnsAsync(withJudiciary ? _judiciaryResponse : new List<JudiciaryPersonResponse>());

            var _courtRoomResponse = new List<UserResponse>
                {
                    new()
                    {
                        FirstName = "FirstName1",
                        LastName = "FirstName2",
                        Email = "judge.1@judiciary.net",
                        ContactEmail = "judge1@personal.com"
                    },
                    new()
                    {
                        FirstName = "FirstName3",
                        LastName = "LastName3",
                        Email = "judge.3@judiciary.net",
                        ContactEmail = "judge3@personal.com"
                    },
                    new()
                    {
                        FirstName = "FirstName2",
                        LastName = "LastName2",
                        Email = "judge.2@judiciary.net", // Out of order to test order
                        ContactEmail = "judge2@personal.com"
                    }
                };

            _userAccountService.Setup(x => x.SearchEjudiciaryJudgesByEmailUserResponse(It.IsAny<string>()))
                .ReturnsAsync(withCourtroom ? _courtRoomResponse : new List<UserResponse>());


            var searchTerm = "judici";
            var result = await _controller.PostJudiciaryPersonBySearchTermAsync(searchTerm);

            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
            var personRespList = (List<PersonResponse>)okRequestResult.Value;

            var expectedJudiciaryCount = withJudiciary ? _judiciaryResponse.Count : 0;
            var expectedCourtRoomCount = withCourtroom ? _courtRoomResponse.Count : 0;

            var expectedTotal = expectedJudiciaryCount + expectedCourtRoomCount;

            personRespList.Count.Should().Be(expectedTotal);
            personRespList.Should().BeInAscendingOrder(x => x.ContactEmail);
        }

        [Test]
        public async Task Should_pass_on_bad_request_from_bookings_api_for_judge_accounts()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var response = await _controller.PostJudiciaryPersonBySearchTermAsync("term");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public void Should_pass_on_exception_request_from_bookings_api_for_judges_accounts()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            Assert.ThrowsAsync<BookingsApiException>(() => _controller.PostJudiciaryPersonBySearchTermAsync("term"));
        }

        [Test]
        public async Task Should_return_judiciary_person_list_by_email_search_term()
        {
            // Arrange
            var term = "test";
            var encodedTerm = JavaScriptEncoder.Default.Encode(term);
            var expectedJudiciaryPersonResponse = new List<JudiciaryPersonResponse>
            {
                new JudiciaryPersonResponse
                {
                    FirstName = "John",
                    LastName = "Doe",
                    Email = "johndoe@hmcts.net"
                }
            };
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(expectedJudiciaryPersonResponse);
            _controller = new AdminWebsite.Controllers.JudiciaryAccountsController(_userAccountService.Object,
                JavaScriptEncoder.Default, _bookingsApiClient.Object, Options.Create(new TestUserSecrets()), _IFeatureFlagMock.Object);

            // Act
            var result = await _controller.SearchForJudiciaryPersonAsync(term);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
            var personRespList = (List<JudiciaryPerson>)okRequestResult.Value;
            personRespList.Count.Should().Be(1);
            personRespList[0].Email.Should().Be(expectedJudiciaryPersonResponse[0].Email);
            _bookingsApiClient.Verify(x => x.PostJudiciaryPersonBySearchTermAsync(It.Is<SearchTermRequest>(y => y.Term == encodedTerm)), Times.Once);
        }

        [Test]
        public async Task Should_return_judiciary_person_list_by_email_search_term_and_filter_out_judges_found_in_both_aad_and_database()
        {
            // Arrange
            var term = "test";
            var encodedTerm = JavaScriptEncoder.Default.Encode(term);
            var expectedJudiciaryPersonResponse = new List<JudiciaryPersonResponse>
            {
                new()
                {
                    FirstName = "John",
                    LastName = "Doe",
                    Email = "johndoe@hmcts.net"
                }
            };
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ReturnsAsync(expectedJudiciaryPersonResponse);
            _userResponses = new List<UserResponse>()
            {
                new()
                {
                    ContactEmail = "johndoe@hmcts.net",
                }
            };
            _userAccountService.Setup(x => x.SearchEjudiciaryJudgesByEmailUserResponse(It.IsAny<string>()))
                .ReturnsAsync(_userResponses);
            _controller = new AdminWebsite.Controllers.JudiciaryAccountsController(_userAccountService.Object,
                JavaScriptEncoder.Default,
                _bookingsApiClient.Object,
                Options.Create(new TestUserSecrets(){TestUsernameStem = "@hmcts.net"}),
                _IFeatureFlagMock.Object);

            // Act
            var result = await _controller.PostJudiciaryPersonBySearchTermAsync(term);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
            var personResponses = (List<PersonResponse>)okRequestResult.Value;
            personResponses.Count.Should().Be(1);
            _bookingsApiClient.Verify(x => x.PostJudiciaryPersonBySearchTermAsync(It.Is<SearchTermRequest>(y => y.Term == encodedTerm)), Times.Once);
        }

        [Test]
        public async Task Should_pass_on_bad_request_from_bookings_api_for_judiciary_person_list_by_email_search_term()
        {
            // Arrange
            var term = "test";
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));
            _controller = new AdminWebsite.Controllers.JudiciaryAccountsController(_userAccountService.Object,
                JavaScriptEncoder.Default,
                _bookingsApiClient.Object, 
                Options.Create(new TestUserSecrets(){TestUsernameStem = "@hmcts.net"}),
                _IFeatureFlagMock.Object);

            // Act
            var response = await _controller.PostJudiciaryPersonBySearchTermAsync(term);

            // Assert
            response.Result.Should().BeOfType<BadRequestObjectResult>();
            _bookingsApiClient.Verify(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()), Times.Once);
        }

        [Test]
        public void Should_pass_on_exception_request_from_bookings_api_for_judiciary_person_list_by_email_search_term()
        {
            // Arrange
            var term = "test";
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            _controller = new AdminWebsite.Controllers.JudiciaryAccountsController(_userAccountService.Object,
                JavaScriptEncoder.Default, _bookingsApiClient.Object, Options.Create(new TestUserSecrets(){TestUsernameStem = "@hmcts.net"}), _IFeatureFlagMock.Object);

            // Act & Assert
            Assert.ThrowsAsync<BookingsApiException>(() => _controller.PostJudiciaryPersonBySearchTermAsync(term));
            _bookingsApiClient.Verify(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()), Times.Once);
        }
        
        [Test]
        [TestCase(false)]
        [TestCase(true)]
        public async Task PostJudgesBySearchTerm_should_return_judiciary_and_courtroom_accounts_if_match_to_search_term(bool withCourtroom)
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                              .ReturnsAsync(new List<JudiciaryPersonResponse>());

            var _courtRoomResponse = new List<JudgeResponse>
            {
                new JudgeResponse
                {
                    FirstName = "FirstName1",
                    LastName = "FirstName2",
                    Email = "judge.1@judiciary.net",
                    ContactEmail = "judge1@personal.com"
                },
                new JudgeResponse
                {
                    FirstName = "FirstName3",
                    LastName = "LastName3",
                    Email = "judge.3@judiciary.net",
                    ContactEmail = "judge3@personal.com"
                },
                new JudgeResponse
                {
                    FirstName = "FirstName2",
                    LastName = "LastName2",
                    Email = "judge.2@judiciary.net", // Out of order to test order
                    ContactEmail = "judge2@personal.com"
                }
            };

            _userAccountService.Setup(x => x.SearchJudgesByEmail(It.IsAny<string>()))
                .ReturnsAsync(withCourtroom ? _courtRoomResponse : new List<JudgeResponse>());


            var searchTerm = "judici";
            var result = await _controller.PostJudgesBySearchTermAsync(searchTerm);

            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
            var personRespList = (List<JudgeResponse>)okRequestResult.Value;

            var expectedResponse = new List<JudgeResponse>();
            var expectedCourtRoomResponses = new List<JudgeResponse>();

            if (withCourtroom)
            {
                expectedCourtRoomResponses = _courtRoomResponse.ToList();
                expectedResponse.AddRange(_courtRoomResponse);
            }

            var expectedTotal =  withCourtroom ? expectedCourtRoomResponses.Count : 0;

            personRespList.Count.Should().Be(expectedTotal);
            if(withCourtroom) // Only courtroom is set up to test order
            {
                Assert.That(personRespList, Is.EquivalentTo(_courtRoomResponse));
                Assert.That(personRespList, Is.Not.EqualTo(_courtRoomResponse));
                Assert.That(personRespList, Is.EqualTo(_courtRoomResponse.OrderBy(x => x.Email)));
            }

            personRespList.Should().BeEquivalentTo(expectedResponse);
        }

          
        [Test]
        public async Task PostJudgesBySearchTerm_should_return_only_courtroom_accounts_if_match_to_search_term_when_Ejud_flag_off()
        {
            _IFeatureFlagMock.Setup(x => x.EJudEnabled()).Returns(false);
            _judiciaryResponse = new List<JudiciaryPersonResponse>
            {
                new()
                {
                    Email = "jackman@judiciary.net",
                    FirstName = "Jack",
                    LastName = "Mann",
                    WorkPhone = "",
                    Title = "Mr",
                    FullName = "Mr Jack Mann",
                    PersonalCode = "12345678"
                }
            };
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                              .ReturnsAsync(_judiciaryResponse);

            var _courtRoomResponse = new List<JudgeResponse>
            {
                new JudgeResponse
                {
                    FirstName = "FirstName1",
                    LastName = "FirstName2",
                    Email = "judge.1@judiciary.net",
                    ContactEmail = "judge1@personal.com"
                },
                new JudgeResponse
                {
                    FirstName = "FirstName3",
                    LastName = "LastName3",
                    Email = "judge.3@judiciary.net",
                    ContactEmail = "judge3@personal.com"
                },
                new JudgeResponse
                {
                    FirstName = "FirstName2",
                    LastName = "LastName2",
                    Email = "judge.2@judiciary.net", // Out of order to test order
                    ContactEmail = "judge2@personal.com"
                }
            };

            _userAccountService.Setup(x => x.SearchJudgesByEmail(It.IsAny<string>()))
                .ReturnsAsync(_courtRoomResponse);
            
            var searchTerm = "judici";
            var result = await _controller.PostJudgesBySearchTermAsync(searchTerm);

            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().NotBeNull();
            var personRespList = (List<JudgeResponse>)okRequestResult.Value;
            personRespList.Count.Should().Be(_courtRoomResponse.Count);
            Assert.That(personRespList, Is.EquivalentTo(_courtRoomResponse));
            Assert.That(personRespList, Is.Not.EqualTo(_courtRoomResponse));
            Assert.That(personRespList, Is.EqualTo(_courtRoomResponse.OrderBy(x => x.Email)));
            personRespList.Should().BeEquivalentTo(_courtRoomResponse);
            personRespList.Should().NotContain(x => _judiciaryResponse.Any(y => y.Email == x.Email));
        }
        
        [Test]
        public async Task PostJudgesBySearchTerm_should_pass_on_bad_request_from_bookings_api_for_Judicary_accounts()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));
           
            var response = await _controller.PostJudiciaryPersonBySearchTermAsync("term");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public void PostJudicaryBySearchTerm_should_pass_on_exception_request_from_bookings_api_for_Judicary_accounts()
        {
            _bookingsApiClient.Setup(x => x.PostJudiciaryPersonBySearchTermAsync(It.IsAny<SearchTermRequest>()))
                  .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            Assert.ThrowsAsync<BookingsApiException>(() => _controller.PostJudiciaryPersonBySearchTermAsync("term"));
        }
    }
}