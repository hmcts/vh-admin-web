using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Contracts.Responses;
using BookingsApi.Client;
using Autofac.Extras.Moq;
using BookingsApi.Contract.V1.Requests;
using VideoApi.Contract.Responses;
using EndpointRequest = AdminWebsite.Contracts.Requests.EndpointRequest;
using LinkedParticipantRequest = AdminWebsite.Contracts.Requests.LinkedParticipantRequest;
using ParticipantRequest = AdminWebsite.Contracts.Requests.ParticipantRequest;
using V1 = BookingsApi.Contract.V1;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class PostHearingTests
    {
        private AutoMock _mocker;
        private AdminWebsite.Controllers.HearingsController _controller;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();

            _mocker.Mock<IConferenceDetailsService>().Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>(), false))
                .ReturnsAsync(new ConferenceDetailsResponse
                {
                    MeetingRoom = new ()
                    {
                        AdminUri = "AdminUri",
                        JudgeUri = "JudgeUri",
                        ParticipantUri = "ParticipantUri",
                        PexipNode = "PexipNode",
                        PexipSelfTestNode = "PexipSelfTestNode",
                        TelephoneConferenceId = "expected_conference_phone_id"
                    }
                });
            _mocker.Mock<IBookingsApiClient>().Setup(bs => bs.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(new V1.Responses.HearingDetailsResponse
                {
                    Participants = new List<V1.Responses.ParticipantResponse>
                    {
                        new () {HearingRoleName = "Judge"}
                    },
                    CaseTypeName = "Generic"
                });
            _mocker.Mock<IFeatureToggles>().Setup(e => e.BookAndConfirmToggle()).Returns(true);
            _controller = _mocker.Create<AdminWebsite.Controllers.HearingsController>();
        }

        [Test]
        public async Task Should_create_a_hearing_with_endpoints()
        {
            
            var newHearingRequest = new BookingDetailsRequest
            {
                Participants = new List<ParticipantRequest>
                {
                    new ()
                    {
                        CaseRoleName = "CaseRole", 
                        ContactEmail = "contact1@hmcts.net",
                        HearingRoleName = "HearingRole", 
                        DisplayName = "display name1",
                        FirstName = "fname", 
                        MiddleNames = "", 
                        LastName = "lname1", 
                        Username = "username1@hmcts.net",
                        OrganisationName = "", 
                        Representee = "", 
                        TelephoneNumber = ""
                    },
                    new ()
                    {
                        CaseRoleName = "CaseRole", ContactEmail = "contact2@hmcts.net",
                        HearingRoleName = "HearingRole", DisplayName = "display name2",
                        FirstName = "fname2", MiddleNames = "", LastName = "lname2",
                        Username = "username2@hmcts.net", OrganisationName = "", Representee = "",
                        TelephoneNumber = ""
                    },
                },
                Endpoints = new List<EndpointRequest>
                {
                    new () {DisplayName = "displayname1", DefenceAdvocateContactEmail = "username1@hmcts.net"},
                    new () {DisplayName = "displayname2", DefenceAdvocateContactEmail = "username2@hmcts.net"},
                }
            };
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = newHearingRequest
            };
                       
            // setup response
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                                        .WithEndPoints(2)
                                        .WithParticipant("Representative", "username1@hmcts.net")
                                        .WithParticipant("Individual", "username2@hmcts.net");
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);
            _mocker.Mock<IUserAccountService>().Setup(x => x.GetAdUserIdForUsername(It.IsAny<string>())).ReturnsAsync(Guid.NewGuid().ToString());

            var result = await _controller.Post(bookingRequest);

            result.Result.Should().BeOfType<CreatedResult>();
            var createdObjectResult = (CreatedResult)result.Result;
            createdObjectResult.StatusCode.Should().Be(201);
        }

        [Test]
        public async Task Should_create_a_hearing_with_LinkedParticipants()
        {
            // request.
            var newHearingRequest = new BookingDetailsRequest()
            {
                Participants = new List<ParticipantRequest>
                {
                    new () { CaseRoleName = "CaseRole", ContactEmail = "firstName1.lastName1@email.com",
                        DisplayName = "firstName1 lastName1", FirstName = "firstName1", HearingRoleName = "Litigant in person", LastName = "lastName1", MiddleNames = "",
                        OrganisationName = "", Representee = "", TelephoneNumber = "1234567890", Title = "Mr.", Username = "firstName1.lastName1@email.net" },
                    new () { CaseRoleName = "CaseRole", ContactEmail = "firstName2.lastName2@email.com",
                        DisplayName = "firstName2 lastName2", FirstName = "firstName2", HearingRoleName = "Interpreter", LastName = "lastName2", MiddleNames = "",
                        OrganisationName = "", Representee = "", TelephoneNumber = "1234567890", Title = "Mr.", Username = "firstName2.lastName2@email.net" },

                },
                LinkedParticipants = new List<LinkedParticipantRequest>
                    {
                        new () { ParticipantContactEmail = "firstName1.lastName1@email.com", LinkedParticipantContactEmail = "firstName2.lastName2@email.com", Type = LinkedParticipantType.Interpreter },
                        new () { ParticipantContactEmail = "firstName2.lastName2@email.com", LinkedParticipantContactEmail = "firstName1.lastName1@email.com", Type = LinkedParticipantType.Interpreter }
                    }
            };
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = newHearingRequest
            };
            // set response.
            var linkedParticipant1 = new List<V1.Responses.LinkedParticipantResponse> { new () { LinkedId = Guid.NewGuid(), Type = V1.Enums.LinkedParticipantType.Interpreter } };
            var participant1 = Builder<V1.Responses.ParticipantResponse>.CreateNew().With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Individual").With(x => x.Username = "firstName1.lastName1@email.net")
                .With(x => x.LinkedParticipants = linkedParticipant1)
                .Build();
            var linkedParticipant2 = new List<V1.Responses.LinkedParticipantResponse>() { new () { LinkedId = Guid.NewGuid(), Type = V1.Enums.LinkedParticipantType.Interpreter } };
            var participant2 = Builder<V1.Responses.ParticipantResponse>.CreateNew().With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Individual").With(x => x.Username = "firstName1.lastName1@email.net")
                .With(x => x.LinkedParticipants = linkedParticipant2)
                .Build();
            var hearingDetailsResponse = Builder<V1.Responses.HearingDetailsResponse>.CreateNew()
                .With(x => x.Cases = Builder<V1.Responses.CaseResponse>.CreateListOfSize(2).Build().ToList())
                .With(x => x.Endpoints = Builder<V1.Responses.EndpointResponse>.CreateListOfSize(2).Build().ToList())
                .With(x => x.Participants = new List<V1.Responses.ParticipantResponse> { participant1, participant2 }).Build();
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);
            _mocker.Mock<IUserAccountService>().Setup(x => x.GetAdUserIdForUsername(It.IsAny<string>())).ReturnsAsync(Guid.NewGuid().ToString());

            var result = await _controller.Post(bookingRequest);
            result.Result.Should().BeOfType<CreatedResult>();
            var createdObjectResult = (CreatedResult)result.Result;
            createdObjectResult.StatusCode.Should().Be(201);
        }

        [Test]
        public async Task Should_pass_bad_request_from_bookings_api()
        {
            var hearing = new BookingDetailsRequest()
            {
                Participants = new List<ParticipantRequest>()
            };
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = hearing
            };

            const string key = "ScheduledDateTime";
            const string errorMessage = "ScheduledDateTime cannot be in the past";
            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {key, [errorMessage] },
            });
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .Throws(ClientException.ForBookingsAPIValidation(validationProblemDetails));

            var result = await _controller.Post(bookingRequest);
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }
        
        [Test]
        public void Should_throw_BookingsApiException()
        {
            var hearing = new BookingDetailsRequest()
            {
                Participants = new List<ParticipantRequest>()
            };

            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = hearing
            };
            
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));

            var response = _controller.Post(bookingRequest);

            ((ObjectResult) response.Result.Result).StatusCode.Should().Be(500);
        }
        
        [Test]
        public void Should_throw_Exception()
        {
            var hearing = new BookingDetailsRequest
            {
                Participants = new List<ParticipantRequest>()
            };
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = hearing
            };

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .Throws(new Exception("Some internal error"));
            
            var response = _controller.Post(bookingRequest);

            ((ObjectResult) response.Result.Result).StatusCode.Should().Be(500);
        }

        [Test]
        public async Task Should_pass_current_user_as_created_by_to_service()
        {
            const string CURRENT_USERNAME = "test@hmcts.net";
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns(CURRENT_USERNAME);

            // setup response
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                                        .WithParticipant("Representative")
                                        .WithParticipant("Individual");
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);

            var result = await PostNewHearing();

            result.Result.Should().BeOfType<CreatedResult>();
            var createdResult = (CreatedResult)result.Result;
            createdResult.Location.Should().Be("");

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.BookNewHearingAsync(It.Is<BookNewHearingRequest>(
                request => request.CreatedBy == CURRENT_USERNAME)), Times.Once);
            _mocker.Mock<IUserAccountService>().Verify(x => x.AssignParticipantToGroup(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task Should_clone_hearing()
        {
            var request = GetMultiHearingRequest();
            request.ScheduledDuration = 120;
            var groupedHearings = new List<V1.Responses.HearingDetailsResponse>
            {
                new()
                {
                    Status = V1.Enums.BookingStatus.Booked,
                    GroupId = Guid.NewGuid(),
                    Id = Guid.NewGuid(),
                }
            };

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(groupedHearings);

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.CloneHearingAsync(It.IsAny<Guid>(), It.IsAny<CloneHearingRequest>()))
                .Verifiable();

            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IBookingsApiClient>().Verify(
                x => x.CloneHearingAsync(It.IsAny<Guid>(), It.Is<CloneHearingRequest>(
                    y => y.ScheduledDuration == request.ScheduledDuration)),
                Times.Exactly(1));
        }

        [Test]
        public async Task Should_clone_and_confirm_hearing_for_large_booking()
        {
            var request = GetMultiHearingRequest();
            var hearingGroupId = Guid.NewGuid();
            var groupedHearings = new List<V1.Responses.HearingDetailsResponse>();
            var batchSize = 30;
            for (var i = 1; i <= batchSize; i++)
            {
                groupedHearings.Add(new V1.Responses.HearingDetailsResponse
                {
                    Status = V1.Enums.BookingStatus.Booked,
                    GroupId = hearingGroupId,
                    Id = Guid.NewGuid()
                });
            }
            
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(groupedHearings);

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.CloneHearingAsync(It.IsAny<Guid>(), It.IsAny<CloneHearingRequest>()))
                .Verifiable();
            
            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<NoContentResult>();
            
            _mocker.Mock<IBookingsApiClient>().Verify(
                x => x.CloneHearingAsync(It.IsAny<Guid>(), It.IsAny<CloneHearingRequest>()),
                Times.Exactly(1));
        }

        [Test]
        public async Task Should_return_bad_request_status_if_no_items_in_the_date_list()
        {
            var startDate = new DateTime(2020, 10, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = new DateTime(2020, 10, 1, 0, 0, 0, DateTimeKind.Utc);
            var request = new MultiHearingRequest { StartDate = startDate, EndDate = endDate};


            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<BadRequestResult>();
        }

        [Test]
        public async Task Should_catch_BookingsApiException_by_clone_hearing()
        {
            var request = GetMultiHearingRequest();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.CloneHearingAsync(It.IsAny<Guid>(), It.IsAny<CloneHearingRequest>()))
                .Throws(new BookingsApiException("Error", (int)HttpStatusCode.BadRequest, "response", null, null));

            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<BadRequestObjectResult>();
        }
        
        [Test]
        public async Task Should_catch_InternalError_by_clone_hearing()
        {
            var request = GetMultiHearingRequest();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.CloneHearingAsync(It.IsAny<Guid>(), It.IsAny<CloneHearingRequest>()))
                .Throws(new BookingsApiException("Error", (int)HttpStatusCode.InternalServerError, "response", null, null));

            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            ((ObjectResult) response).StatusCode.Should().Be(500);
        }

        [TestCase("2023-01-07", "2023-01-09")]
        [TestCase("2023-01-08", "2023-01-09")]
        [TestCase("2023-01-06", "2023-01-07")]
        [TestCase("2023-01-06", "2023-01-08")]
        public async Task Should_clone_hearings_on_weekends_when_start_or_end_date_are_on_weekends(DateTime startDate, DateTime endDate)
        {
            var request = new MultiHearingRequest { StartDate = startDate, EndDate = endDate};
            var groupedHearings = new List<V1.Responses.HearingDetailsResponse>
            {
                new()
                {
                    Status = V1.Enums.BookingStatus.Booked,
                    GroupId = Guid.NewGuid(),
                    Id = Guid.NewGuid(),
                }
            };
            
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(groupedHearings);
            
            var expectedDates = new List<DateTime>();
            for (var date = startDate.AddDays(1); date <= endDate; date = date.AddDays(1))
            {
                expectedDates.Add(date);
            }
            
            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IBookingsApiClient>().Verify(
                x => x.CloneHearingAsync(It.IsAny<Guid>(), 
                    It.Is<CloneHearingRequest>(r => r.Dates.All(d => expectedDates.Contains(d)))),
                Times.Exactly(1));
        }
        
        [Test]
        public async Task Should_not_clone_hearings_on_weekends_when_start_or_end_date_are_on_weekdays()
        {
            var startDate = new DateTime(2022, 12, 15, 0, 0, 0, DateTimeKind.Utc);
            var endDate = new DateTime(2022, 12, 20, 0, 0, 0, DateTimeKind.Utc);
            var request = new MultiHearingRequest { StartDate = startDate, EndDate = endDate};
            var groupedHearings = new List<V1.Responses.HearingDetailsResponse>
            {
                new()
                {
                    Status = V1.Enums.BookingStatus.Booked,
                    GroupId = Guid.NewGuid(),
                    Id = Guid.NewGuid(),
                }
            };
            
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(groupedHearings);

            var expectedDates = new List<DateTime>
            {
                new(2022, 12, 16, 0, 0, 0, DateTimeKind.Utc),
                new(2022, 12, 17, 0, 0, 0, DateTimeKind.Utc),
                new(2022, 12, 18, 0, 0, 0, DateTimeKind.Utc),
                new(2022, 12, 19, 0, 0, 0, DateTimeKind.Utc),
                new(2022, 12, 20, 0, 0, 0, DateTimeKind.Utc)
            };
            
            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IBookingsApiClient>().Verify(
                x => x.CloneHearingAsync(It.IsAny<Guid>(), 
                    It.Is<CloneHearingRequest>(r => r.Dates.All(d => expectedDates.Contains(d)))),
                Times.Exactly(1));
        }

        [Test]
        public async Task Should_clone_hearings_using_hearing_dates()
        {
            var hearingDates = new List<DateTime>
            {
                new (2023, 1, 6, 0, 0, 0, DateTimeKind.Utc),
                new (2023, 1, 7, 0, 0, 0, DateTimeKind.Utc),
                new (2023, 1, 8, 0, 0, 0, DateTimeKind.Utc)
            };
            var request = new MultiHearingRequest { HearingDates = hearingDates };
            var groupedHearings = new List<V1.Responses.HearingDetailsResponse>
            {
                new()
                {
                    Status = V1.Enums.BookingStatus.Booked,
                    GroupId = Guid.NewGuid(),
                    Id = Guid.NewGuid(),
                }
            };
            
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(groupedHearings);

            var expectedDates = new List<DateTime>
            {
                new (2023, 1, 6, 0, 0, 0, DateTimeKind.Utc),
                new (2023, 1, 7, 0, 0, 0, DateTimeKind.Utc),
                new (2023, 1, 8, 0, 0, 0, DateTimeKind.Utc)
            };
            
            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IBookingsApiClient>().Verify(
                x => x.CloneHearingAsync(It.IsAny<Guid>(), 
                    It.Is<CloneHearingRequest>(r => r.Dates.All(d => expectedDates.Contains(d)))),
                Times.Exactly(1));
        }

        private static MultiHearingRequest GetMultiHearingRequest()
        {
            var startDate = new DateTime(2020, 10, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = new DateTime(2020, 10, 6, 0, 0, 0, DateTimeKind.Utc);
            return new MultiHearingRequest { StartDate = startDate, EndDate = endDate };
        }

        private Task<ActionResult<HearingDetailsResponse>> PostNewHearing()
        {
            // without supplying participants
            return PostWithParticipants();
        }

        private async Task<ActionResult<HearingDetailsResponse>> PostWithParticipants(params ParticipantRequest[] participants)
        {
            var hearing = new BookingDetailsRequest
            {
                Participants = new List<ParticipantRequest>(participants)
            };
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = hearing
            };

            return await _controller.Post(bookingRequest);
        }
    }
}