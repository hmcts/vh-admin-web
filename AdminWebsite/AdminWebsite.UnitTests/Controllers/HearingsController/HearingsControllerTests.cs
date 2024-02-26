using System;
using AdminWebsite.Configuration;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using BookingsApi.Client;
using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class HearingsControllerTests
    {
        protected Mock<IBookingsApiClient> BookingsApiClient;
        protected Mock<IUserIdentity> UserIdentity;
        protected Mock<IFeatureToggles> FeatureToggle;
        protected AdminWebsite.Controllers.HearingsController Controller;
        
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private Mock<IConferenceDetailsService> _conferencesServiceMock;
        private Mock<IOptions<KinlyConfiguration>> _kinlyOptionsMock;
        private Mock<KinlyConfiguration> _kinlyConfigurationMock;
        private Mock<ILogger<HearingsService>> _participantGroupLogger;
        private IHearingsService _hearingsService;
        
        [SetUp]
        protected void Setup()
        {
            BookingsApiClient = new Mock<IBookingsApiClient>();
            UserIdentity = new Mock<IUserIdentity>();
            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();
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

            _kinlyOptionsMock = new Mock<IOptions<KinlyConfiguration>>();
            _kinlyConfigurationMock = new Mock<KinlyConfiguration>();
            _kinlyOptionsMock.Setup((op) => op.Value).Returns(_kinlyConfigurationMock.Object);

            _participantGroupLogger = new Mock<ILogger<HearingsService>>();
            _hearingsService = new HearingsService(BookingsApiClient.Object, _participantGroupLogger.Object, FeatureToggle.Object);

            FeatureToggle.Setup(x => x.EJudEnabled()).Returns(true);

            Controller = new AdminWebsite.Controllers.HearingsController(BookingsApiClient.Object,
                UserIdentity.Object,
                _editHearingRequestValidator.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _hearingsService,
                _conferencesServiceMock.Object,
                 FeatureToggle.Object);
        }
    }
}
