using AdminWebsite.Models;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using AdminWebsite.Security;
using BookingsApi.Contract.V1.Enums;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Enums;
using FluentValidation;
using Microsoft.Extensions.Logging;
using BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class GetStatusHearingTests
    {
        private AdminWebsite.Controllers.HearingsController _controller;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        private Mock<IConferenceDetailsService> _conferenceDetailsServiceMock;
        private Mock<IHearingsService> _hearingServiceMock;
        private HearingDetailsResponse _vhExistingHearing;
        private HearingDetailsResponseV2 _vhExistingHearingV2;
        private Mock<IFeatureToggles> _featureFlag;
        private Guid _guid;
        
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            
            _mocker = AutoMock.GetLoose();
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _conferenceDetailsServiceMock = new Mock<IConferenceDetailsService>();
            _hearingServiceMock = new Mock<IHearingsService>();
            _featureFlag = new Mock<IFeatureToggles>();
            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClientMock.Object, 
                new Mock<IUserIdentity>().Object,
                new Mock<IValidator<EditHearingRequest>>().Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _hearingServiceMock.Object,
                _conferenceDetailsServiceMock.Object,
                _featureFlag.Object);
                

            Initialise();
        }
        
        public void Initialise()
        {
            _guid = Guid.NewGuid();
            _vhExistingHearing = new HearingDetailsResponse
            {
                Cases = new List<BookingsApi.Contract.V1.Responses.CaseResponse>()
                {
                    new BookingsApi.Contract.V1.Responses.CaseResponse
                        {Name = "BBC vs ITV", Number = "TX/12345/2019", IsLeadCase = false}
                },
                CaseTypeName = "Generic",
                CreatedBy = "CaseAdministrator",
                CreatedDate = DateTime.UtcNow,
                HearingRoomName = "Room 6.41D",
                HearingTypeName = "Automated Test",
                HearingVenueName = "Manchester Civil and Family Justice Centre",
                Id = _guid,
                OtherInformation = "Any other information about the hearing",
                Participants = new List<ParticipantResponse>
                {
                    new()
                    {
                        CaseRoleName = "Judge", ContactEmail = "Judge.Lumb@hmcts.net", DisplayName = "Judge Lumb",
                        FirstName = "Judge", HearingRoleName = "Judge", LastName = "Lumb", MiddleNames = string.Empty,
                        TelephoneNumber = string.Empty, Title = "Judge", Username = "Judge.Lumb@hearings.net", UserRoleName = "Judge"
                    },
                    new()
                    {
                        CaseRoleName = "Applicant", ContactEmail = "test.applicant@hmcts.net",
                        DisplayName = "Test Applicant", FirstName = "Test", HearingRoleName = "Litigant in person",
                        LastName = "Applicant", MiddleNames = string.Empty, TelephoneNumber = string.Empty,
                        Title = "Mr", Username = "Test.Applicant@hearings.net", UserRoleName = "Individual"
                    },
                    new()
                    {
                        CaseRoleName = "Respondent", ContactEmail = "test.respondent@hmcts.net",
                        DisplayName = "Test Respondent", FirstName = "Test", HearingRoleName = "Representative",
                        LastName = "Respondent", MiddleNames = string.Empty, TelephoneNumber = string.Empty,
                        Title = "Mr", Username = "Test.Respondent@hearings.net", UserRoleName = "Represntative"
                    },
                },
                ScheduledDateTime = DateTime.UtcNow.AddDays(10),
                ScheduledDuration = 60,
                Status = BookingStatus.Booked,
                UpdatedBy = string.Empty,
                UpdatedDate = DateTime.UtcNow
            };

            _bookingsApiClientMock.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_vhExistingHearing);

            _bookingsApiClientMock.Setup(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(GetHearingDetailsResponseV2(BookingsApi.Contract.V2.Enums.BookingStatusV2.Booked));
        }

        [Test]
        public async Task Should_return_false_when_hearing_not_be_found()
        {
            // Arrange
            _bookingsApiClientMock.Setup(x => x.GetBookingStatusByIdAsync(It.IsAny<Guid>())).Throws(new BookingsApiException("Error", 404, null, null, null));

            // Act
            var result = await _controller.GetHearingConferenceStatus(_guid);

            // Assert
            var notFoundResult = (OkObjectResult)result;
            notFoundResult.StatusCode.Should().Be(200);
            ((UpdateBookingStatusResponse)notFoundResult.Value)?.Success.Should().BeFalse();
        }
        
        [Test]
        public async Task Should_return_not_found_if_hearing_failed_to_be_found()
        {
            // Arrange
            _bookingsApiClientMock
                .Setup(x => x.FailBookingAsync(_guid))
                .ThrowsAsync(new VideoApiException("Error", 404, null, null, null));

            // Act
            var result = await _controller.UpdateFailedBookingStatus(_guid);

            // Assert
            _bookingsApiClientMock.Verify(x => x.FailBookingAsync(_guid), Times.AtLeastOnce);
            var notFoundResult = (NotFoundResult)result;
            notFoundResult.StatusCode.Should().Be(404);
        }

        [Test]
        public async Task Should_return_badRequest_if_hearing_failed_to_fail()
        {
            // Arrange
            _bookingsApiClientMock
                .Setup(x => x.FailBookingAsync(_guid))
                .ThrowsAsync(new VideoApiException("Error", 400, null, null, null));

            // Act
            var result = await _controller.UpdateFailedBookingStatus(_guid);

            // Assert
            _bookingsApiClientMock.Verify(x => x.FailBookingAsync(_guid), Times.AtLeastOnce);
            var notFoundResult = (BadRequestObjectResult)result;
            notFoundResult.StatusCode.Should().Be(400);
        }

        [Test]
        public async Task Should_return_ok_status_with_success()
        {
            // Arrange
            ConferenceDetailsResponse conferenceResponse = new()
            {
                MeetingRoom = new()
                {
                    AdminUri = "AdminUri",
                    ParticipantUri = "ParticipantUri",
                    JudgeUri = "JudgeUri",
                    PexipNode = "PexipNode"
                }
            };

            _conferenceDetailsServiceMock.Setup(x => x.GetConferenceDetailsByHearingId(_guid, false))
                .ReturnsAsync(conferenceResponse);
            _vhExistingHearingV2.Status = BookingsApi.Contract.V2.Enums.BookingStatusV2.Created;

            // Act
            var result = await _controller.GetHearingConferenceStatus(_guid);

            // Assert
            var okRequestResult = (OkObjectResult)result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (UpdateBookingStatusResponse)((OkObjectResult)result).Value;
            hearing.Success.Should().Be(true);
            _conferenceDetailsServiceMock.Verify(x => x.GetConferenceDetailsByHearingId(It.IsAny<Guid>(), false), Times.Once);
            _bookingsApiClientMock.Verify(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()), Times.Once);

        }

        private HearingDetailsResponseV2 GetHearingDetailsResponseV2(BookingsApi.Contract.V2.Enums.BookingStatusV2 status)
        {
            _guid = Guid.NewGuid();
            _vhExistingHearingV2 = new HearingDetailsResponseV2
            {
                Cases = new List<CaseResponseV2>
                {
                    new CaseResponseV2
                        {Name = "BBC vs ITV", Number = "TX/12345/2019", IsLeadCase = false}
                },
                CreatedBy = "CaseAdministrator",
                CreatedDate = DateTime.UtcNow,
                HearingRoomName = "Room 6.41D",
                HearingVenueName = "Manchester Civil and Family Justice Centre",
                Id = _guid,
                OtherInformation = "Any other information about the hearing",
                Participants = new List<BookingsApi.Contract.V2.Responses.ParticipantResponseV2>
                {
                    new()
                    {
                        ContactEmail = "Judge.Lumb@hmcts.net", DisplayName = "Judge Lumb",
                        FirstName = "Judge", LastName = "Lumb", MiddleNames = string.Empty,
                        TelephoneNumber = string.Empty, Title = "Judge", Username = "Judge.Lumb@hearings.net", UserRoleName = "Judge"
                    },
                    new()
                    {
                        ContactEmail = "test.applicant@hmcts.net",
                        DisplayName = "Test Applicant", FirstName = "Test", 
                        LastName = "Applicant", MiddleNames = string.Empty, TelephoneNumber = string.Empty,
                        Title = "Mr", Username = "Test.Applicant@hearings.net", UserRoleName = "Individual"
                    },
                    new()
                    {
                        ContactEmail = "test.respondent@hmcts.net",
                        DisplayName = "Test Respondent", FirstName = "Test",
                        LastName = "Respondent", MiddleNames = string.Empty, TelephoneNumber = string.Empty,
                        Title = "Mr", Username = "Test.Respondent@hearings.net", UserRoleName = "Representative"
                    },
                },
                ScheduledDateTime = DateTime.UtcNow.AddDays(10),
                ScheduledDuration = 60,
                Status = status,
                UpdatedBy = string.Empty,
                UpdatedDate = DateTime.UtcNow
            };
            return _vhExistingHearingV2;
        }
    }
}
