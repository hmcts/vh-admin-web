using AdminWebsite.Configuration;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using BookingsApi.Client;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;
using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public abstract class HearingsControllerTests
    {
        private Mock<IConferenceDetailsService> _conferencesServiceMock;

        private IHearingsService _hearingsService;
        private Mock<ILogger<HearingsService>> _participantGroupLogger;
        private Mock<VodafoneConfiguration> _VodafoneConfigurationMock;
        private Mock<IOptions<VodafoneConfiguration>> _VodafoneOptionsMock;
        protected Mock<IBookingsApiClient> BookingsApiClient;
        protected AdminWebsite.Controllers.HearingsController Controller;
        protected Mock<IFeatureToggles> FeatureToggle;
        protected Mock<IUserIdentity> UserIdentity;

        [SetUp]
        protected virtual void Setup()
        {
            BookingsApiClient = new Mock<IBookingsApiClient>();
            UserIdentity = new Mock<IUserIdentity>();
            _conferencesServiceMock = new Mock<IConferenceDetailsService>();
            FeatureToggle = new Mock<IFeatureToggles>();
            _conferencesServiceMock.Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>(), false))
                .ReturnsAsync(new ConferenceDetailsResponse
                {
                    MeetingRoom = new MeetingRoomResponse
                    {
                        AdminUri = "AdminUri",
                        JudgeUri = "JudgeUri",
                        ParticipantUri = "ParticipantUri",
                        PexipNode = "PexipNode",
                        PexipSelfTestNode = "PexipSelfTestNode",
                        TelephoneConferenceId = "expected_conference_phone_id"
                    }
                });

            _VodafoneOptionsMock = new Mock<IOptions<VodafoneConfiguration>>();
            _VodafoneConfigurationMock = new Mock<VodafoneConfiguration>();
            _VodafoneOptionsMock.Setup((op) => op.Value).Returns(_VodafoneConfigurationMock.Object);

            _participantGroupLogger = new Mock<ILogger<HearingsService>>();
            _hearingsService = new HearingsService(BookingsApiClient.Object, _participantGroupLogger.Object);

            Controller = new AdminWebsite.Controllers.HearingsController(BookingsApiClient.Object,
                UserIdentity.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _hearingsService,
                _conferencesServiceMock.Object);
        }

        protected static List<HearingDetailsResponseV2> CreateListOfV2HearingsInMultiDayGroup(
            Guid groupId, Guid initialHearingId)
        {
            var hearingDates = new List<DateTime>
            {
                DateTime.Today.AddDays(1).AddHours(10),
                DateTime.UtcNow.AddDays(2).AddHours(10),
                DateTime.UtcNow.AddDays(3).AddHours(10)
            };

            return CreateListOfV2HearingsInMultiDayGroupAsV2(groupId, initialHearingId, hearingDates);
        }

        protected static List<HearingDetailsResponseV2> CreateListOfV2HearingsInMultiDayGroup(
            Guid groupId, Guid initialHearingId, List<DateTime> scheduledDates)
        {
            var hearingsInMultiDay = new List<HearingDetailsResponseV2>();
            var i = 0;
            foreach (var date in scheduledDates)
            {
                var hearing = Builder<HearingDetailsResponseV2>.CreateNew().Build();

                hearing.Participants = new List<ParticipantResponseV2>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        FirstName = "Applicant",
                        LastName = "Test",
                        ContactEmail = "applicant@email.com",
                        Username = "applicant@hearings.reform.hmcts.net",
                        HearingRoleName = "Applicant",
                        UserRoleName = "Individual"
                    }
                };
                
                hearing.JudicialOfficeHolders = new List<JudiciaryParticipantResponse>
                {
                    new()
                    {
                        PersonalCode = "PersonalCode",
                        DisplayName = "Judge Test",
                        FirstName = "Judge",
                        LastName = "Test",
                        Email = "judge@email.com",
                        HearingRoleCode = JudiciaryParticipantHearingRoleCode.Judge
                    }
                };
                
                hearing.Endpoints = new List<EndpointResponseV2>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        DisplayName = "Endpoint A"
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        DisplayName = "Endpoint B"
                    }
                };
                
                hearing.GroupId = groupId;
                hearing.ScheduledDateTime = date;
                hearing.ScheduledDuration = 45;
                hearing.Status = BookingStatusV2.Created;
                hearing.Id = i == 0 ? initialHearingId : Guid.NewGuid();
                
                hearingsInMultiDay.Add(hearing);
                
                i++;
            }

            return hearingsInMultiDay;
        }

        protected static List<HearingDetailsResponseV2> CreateListOfV2HearingsInMultiDayGroupAsV2(
            Guid groupId, Guid initialHearingId, List<DateTime> scheduledDates)
        {
            var hearingsInMultiDay = new List<HearingDetailsResponseV2>();
            var i = 0;
            foreach (var date in scheduledDates)
            {
                var hearing = Builder<HearingDetailsResponseV2>.CreateNew().Build();

                var interpreteeId = Guid.NewGuid();
                var interpreterId = Guid.NewGuid();
                
                hearing.Participants = new List<ParticipantResponseV2>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        FirstName = "Applicant",
                        LastName = "Test",
                        ContactEmail = "applicant@email.com",
                        Username = "applicant@hearings.reform.hmcts.net",
                        HearingRoleName = "Applicant",
                        HearingRoleCode = "APPL",
                        UserRoleName = "Individual",
                        LinkedParticipants = new List<LinkedParticipantResponseV2>()
                    },
                    new()
                    {
                        Id = interpreteeId,
                        FirstName = "Interpretee",
                        LastName = "Test",
                        ContactEmail = "interpretee@email.com",
                        Username = "interpretee@hearings.reform.hmcts.net",
                        HearingRoleName = "Applicant",
                        HearingRoleCode = "APPL",
                        UserRoleName = "Individual",
                        LinkedParticipants = new List<LinkedParticipantResponseV2>
                        {
                            new()
                            {
                                LinkedId = interpreterId,
                                TypeV2 = LinkedParticipantTypeV2.Interpreter
                            }
                        }
                    },
                    new()
                    {
                        Id = interpreterId,
                        FirstName = "Interpreter",
                        LastName = "Test",
                        ContactEmail = "interpreter@email.com",
                        Username = "interpreter@hearings.reform.hmcts.net",
                        HearingRoleName = "Interpreter",
                        HearingRoleCode = "INTP",
                        UserRoleName = "Individual",
                        LinkedParticipants = new List<LinkedParticipantResponseV2>
                        {
                            new()
                            {
                                LinkedId = interpreteeId,
                                TypeV2 = LinkedParticipantTypeV2.Interpreter
                            }
                        }
                    }
                };
                
                hearing.JudicialOfficeHolders = new List<JudiciaryParticipantResponse>
                {
                    new()
                    {
                        PersonalCode = "PersonalCode",
                        DisplayName = "Judge Test",
                        FirstName = "Judge",
                        LastName = "Test",
                        Email = "judge@email.com",
                        HearingRoleCode = JudiciaryParticipantHearingRoleCode.Judge
                    }
                };
                
                hearing.Endpoints = new List<EndpointResponseV2>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        DisplayName = "Endpoint A"
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        DisplayName = "Endpoint B",
                        DefenceAdvocateId = hearing.Participants[1].Id
                    }
                };
                
                hearing.Cases = new List<CaseResponseV2>
                {
                    new()
                    {
                        Number = "TestCaseNumber",
                        Name = "TestCaseName"
                    }
                };
                
                hearing.GroupId = groupId;
                hearing.ScheduledDateTime = date;
                hearing.ScheduledDuration = 45;
                hearing.Status = BookingStatusV2.Created;
                hearing.Id = i == 0 ? initialHearingId : Guid.NewGuid();
                
                hearingsInMultiDay.Add(hearing);
                
                i++;
            }

            return hearingsInMultiDay;
        }
    }
}
