using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Services;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Configuration;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Requests.Enums;
using BookingsApi.Contract.V1.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Responses;
using CaseResponse = BookingsApi.Contract.V1.Responses.CaseResponse;
using EndpointResponse = BookingsApi.Contract.V1.Responses.EndpointResponse;

namespace AdminWebsite.UnitTests.Services
{
    public class HearingServiceTests
    {
        private AutoMock _mocker;
        private HearingsService _service;
        private HearingDetailsResponse _hearing;
        private const string ExpectedTeleConferencePhoneNumber = "expected_conference_phone_number";
        private const string ExpectedTeleConferenceId = "expected_conference_phone_id";
        
        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IOptions<KinlyConfiguration>>().Setup(opt => opt.Value).Returns(new KinlyConfiguration()
            {
                ConferencePhoneNumber = ExpectedTeleConferencePhoneNumber
            });

            _mocker.Mock<IConferenceDetailsService>()
                .Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>(), false))
                .ReturnsAsync(new ConferenceDetailsResponse
                {
                    MeetingRoom = new MeetingRoomResponse
                    {
                        AdminUri = "AdminUri",
                        JudgeUri = "JudgeUri",
                        ParticipantUri = "ParticipantUri",
                        PexipNode = "PexipNode",
                        PexipSelfTestNode = "PexipSelfTestNode",
                        TelephoneConferenceId = ExpectedTeleConferenceId
                    }
                });
            _mocker.Mock<IBookingsApiClient>()
                .Setup(c => c.GetHearingsByGroupIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(new List<HearingDetailsResponse> { _hearing });
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetFeatureFlagAsync(It.Is<string>(f => f == nameof(FeatureFlags.EJudFeature)))).ReturnsAsync(true);
            _mocker.Mock<IFeatureToggles>()
                .Setup(x => x.BookAndConfirmToggle()).Returns(true);
            _service = _mocker.Create<HearingsService>();
            _hearing = InitHearing();
        }

        [Test]
        public void Should_return_false_when_nothing_changed_in_participants()
        {
            var participantRequest1 = new EditParticipantRequest { Id = It.IsAny<Guid>(), DisplayName = "Test", };
            var editParticipants1 = new List<EditParticipantRequest> { participantRequest1 };
            var editParticipants2 = new List<EditParticipantRequest> { participantRequest1 };

            Assert.True(_service.GetAddedParticipant(editParticipants1, editParticipants2).Count == 0);
        }

        [Test]
        public void Should_have_one_added_participant()
        {
            var originalParticipants = new List<EditParticipantRequest> 
            { 
                new EditParticipantRequest 
                { 
                    Id = It.IsAny<Guid>(), 
                    DisplayName = "Test" 
                } 
            };

            // This should contain the existing participants as well as the new participants
            var editParticipantRequest = new List<EditParticipantRequest> 
            { 
                new EditParticipantRequest 
                { 
                    Id = It.IsAny<Guid>(), 
                    DisplayName = "Test" 
                }, 
                new EditParticipantRequest 
                { 
                    Id = It.IsAny<Guid>(), 
                    DisplayName = "Test2" 
                } 
            };

            Assert.AreEqual(1, _service.GetAddedParticipant(originalParticipants, editParticipantRequest).Count);
        }
        
        [Test]
        public async Task Should_process_participants()
        {
            var existingParticipants = new List<UpdateParticipantRequest>();
            var newParticipants = new List<BookingsApi.Contract.V1.Requests.ParticipantRequest>();
            var removedParticipantIds = new List<Guid>();
            var linkedParticipants = new List<LinkedParticipantRequest>();

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdAsync(_hearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponse> { _hearing });

            await _service.ProcessParticipants(_hearing.Id, existingParticipants, newParticipants, removedParticipantIds, linkedParticipants);

            _mocker.Mock<IBookingsApiClient>()
                .Verify(
                    x => x.UpdateHearingParticipantsAsync(_hearing.Id, It.Is<UpdateHearingParticipantsRequest>(x =>
                        x.ExistingParticipants == existingParticipants
                        && x.NewParticipants == newParticipants
                        && x.RemovedParticipantIds == removedParticipantIds
                        && x.LinkedParticipants == linkedParticipants)), Times.Once);
        }

        [TestCase(RoleNames.PanelMember)]
        [TestCase(RoleNames.Winger)]
        public async Task Should_process_new_joh_participant_EJudFeature_Is_ON(string hearingRole)
        {
            // Arrange
            var participant = new EditParticipantRequest()
            {
                Id = Guid.NewGuid(),
                HearingRoleName = hearingRole,
                ContactEmail = "contact@email.com"
            };
            var removedParticipantIds = new List<Guid>();

            // Act
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing.Map());

            // Assert
            newParticipant.Should().NotBeNull();
            newParticipant.Username.Should().Be(participant.ContactEmail);
        }

        [TestCase(RoleNames.PanelMember)]
        [TestCase(RoleNames.Winger)]
        public async Task Should_process_new_joh_participant_EJudFeature_Is_OFF(string hearingRole)
        {
            // Arrange
            var participant = new EditParticipantRequest()
            {
                Id = Guid.NewGuid(),
                HearingRoleName = hearingRole,
                ContactEmail = "contact@email.com"
            };
            var removedParticipantIds = new List<Guid>();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetFeatureFlagAsync(It.Is<string>(f => f == nameof(FeatureFlags.EJudFeature)))).ReturnsAsync(false);

            // Act
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing.Map());

            // Assert
            newParticipant.Should().NotBeNull();
            newParticipant.Username.Should().NotBe(participant.ContactEmail);
        }

        [Test]
        public async Task Should_process_new_judge_participant_EJudFeature_Is_OFF()
        {
            // Arrange
            var participant = new EditParticipantRequest()
            {
                Id = Guid.NewGuid(),
                CaseRoleName = "Judge",
                ContactEmail = "contact@email.com"
            };
            var removedParticipantIds = new List<Guid>();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetFeatureFlagAsync(It.Is<string>(f => f == nameof(FeatureFlags.EJudFeature)))).ReturnsAsync(false);

            // Act
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing.Map());

            // Assert
            newParticipant.Should().NotBeNull();
            newParticipant.Username.Should().Be(participant.ContactEmail);
        }

        [Test]
        public async Task Should_NOT_process_new_joh_participant_when_participant_is_in_list_and_NOT_removed()
        {
            // Arrange
            var participant = new EditParticipantRequest()
            {
                Id = Guid.NewGuid(),
                HearingRoleName = "Panel Member",
                ContactEmail = "contact@email.com"
            };

            _hearing.Participants.Add(new ParticipantResponse()
            {
                Id = participant.Id.Value,
                Username = participant.ContactEmail,
                ContactEmail = participant.ContactEmail
            });

            var removedParticipantIds = new List<Guid>();

            // Act
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing.Map());

            // Assert
            newParticipant.Should().BeNull();
        }

        [Test]
        public async Task Should_process_new_joh_participant_when_participant_is_in_list_and_is_removed()
        {
            // Arrange
            var participant = new EditParticipantRequest()
            {
                Id = Guid.NewGuid(),
                CaseRoleName = "Judge",
                ContactEmail = "contact@email.com"
            };

            _hearing.Participants.Add(new ParticipantResponse()
            {
                Id = participant.Id.Value,
                Username = participant.ContactEmail,
                ContactEmail = participant.ContactEmail
            });

            var removedParticipantIds = new List<Guid>
            {
                participant.Id.Value
            };

            // Act
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing.Map());

            // Assert
            newParticipant.Should().NotBeNull();
            newParticipant.Username.Should().Be(participant.ContactEmail);
        }

        [Test]
        public async Task Should_process_non_joh_participant()
        {
            // Arrange
            var participant = new EditParticipantRequest()
            {
                Id = Guid.NewGuid(),
                CaseRoleName = "NOT JUDGE",
                ContactEmail = "contact@email.com"
            };

            var removedParticipantIds = new List<Guid>();

            // Act
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing.Map());

            // Assert
            newParticipant.Should().NotBeNull();
            newParticipant.Username.Should().NotBe(participant.ContactEmail);
        }
        
        private HearingDetailsResponse InitHearing()
        {
            var cases = new List<CaseResponse> { new CaseResponse { Name = "Test", Number = "123456" } };
            var rep = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Representative")
                .Build();
            var ind = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Individual")
                .Build();
            var joh = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Judicial Office Holder")
                .Build();
            var judge = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Judge")
                .With(x => x.ContactEmail = "Judge@court.com")
                .With(x => x.HearingRoleName = "Judge")
                .Build();
            var staffMember = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Staff Member")
                .Build();
            var telephoneParticipant = Builder<TelephoneParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .Build();

            return Builder<HearingDetailsResponse>.CreateNew()
                .With(h => h.Participants = new List<ParticipantResponse> { rep, ind, joh, judge, staffMember })
                .With(h => h.TelephoneParticipants = new List<TelephoneParticipantResponse> { telephoneParticipant })
                .With(x => x.Cases = cases)
                .With(x => x.Id = Guid.NewGuid())
                .Build();
        }
        [Test]
        public async Task Should_Invoke_BookingAPI_UpdateBookingStatusAsync_when_UpdateFailedBookingStatus_called()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            // Act
            await _service.UpdateFailedBookingStatus(hearingId);

            // Assert
            _mocker.Mock<IBookingsApiClient>().Verify(x 
                => x.UpdateBookingStatusAsync(
                    hearingId, 
                    It.Is<UpdateBookingStatusRequest>(pred => pred.Status == UpdateBookingStatus.Failed)), 
                Times.Once);
        }
        
    }
}