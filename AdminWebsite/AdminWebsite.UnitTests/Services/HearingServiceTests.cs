using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Services;
using AdminWebsite.Services.Models;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.Configuration;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Responses;
using CaseResponse = BookingsApi.Contract.Responses.CaseResponse;
using EndpointResponse = BookingsApi.Contract.Responses.EndpointResponse;

namespace AdminWebsite.UnitTests.Services
{
    public class HearingServiceTests
    {
        private AutoMock _mocker;
        private HearingsService _service;
        private HearingDetailsResponse _hearing;
        private const string _expectedTeleConferencePhoneNumber = "expected_conference_phone_number";
        private const string _expectedTeleConferenceId = "expected_conference_phone_id";

        private HearingDetailsResponse _updatedExistingParticipantHearingOriginal;
        private Guid _validId;
        private EditHearingRequest _editHearingRequest;
        List<CaseResponse> _cases;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IOptions<KinlyConfiguration>>().Setup(opt => opt.Value).Returns(new KinlyConfiguration()
            {
                ConferencePhoneNumber = _expectedTeleConferencePhoneNumber
            });

            _mocker.Mock<IConferenceDetailsService>()
                .Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
                .ReturnsAsync(new ConferenceDetailsResponse
                {
                    MeetingRoom = new MeetingRoomResponse
                    {
                        AdminUri = "AdminUri",
                        JudgeUri = "JudgeUri",
                        ParticipantUri = "ParticipantUri",
                        PexipNode = "PexipNode",
                        PexipSelfTestNode = "PexipSelfTestNode",
                        TelephoneConferenceId = _expectedTeleConferenceId
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
            _validId = Guid.NewGuid();

            _cases = new List<CaseResponse> { new CaseResponse { Name = "Case", Number = "123" } };

            _updatedExistingParticipantHearingOriginal = new HearingDetailsResponse
            {
                Id = _validId,
                GroupId = _validId,
                Participants =
                    new List<ParticipantResponse>
                    {
                        new ParticipantResponse
                        {
                            Id = Guid.NewGuid(),
                            UserRoleName = "Individual",
                            ContactEmail = "old@hmcts.net",
                            Username = "old@hmcts.net"
                        }
                    },
                Cases = _cases,
                CaseTypeName = "Unit Test",
                ScheduledDateTime = DateTime.UtcNow.AddHours(3),
                Endpoints = new List<EndpointResponse>
                {
                    new EndpointResponse
                    {
                        Id = Guid.NewGuid(), DisplayName = "test", DefenceAdvocateId = Guid.NewGuid(),
                    }
                }
            };

            _editHearingRequest = new EditHearingRequest
            {
                HearingRoomName = _updatedExistingParticipantHearingOriginal.HearingRoomName,
                HearingVenueName = _updatedExistingParticipantHearingOriginal.HearingVenueName,
                OtherInformation = _updatedExistingParticipantHearingOriginal.OtherInformation,
                ScheduledDateTime = _updatedExistingParticipantHearingOriginal.ScheduledDateTime,
                ScheduledDuration = _updatedExistingParticipantHearingOriginal.ScheduledDuration,
                QuestionnaireNotRequired = _updatedExistingParticipantHearingOriginal.QuestionnaireNotRequired,
                AudioRecordingRequired = _updatedExistingParticipantHearingOriginal.AudioRecordingRequired,
                Case = new EditCaseRequest
                {
                    Name = _updatedExistingParticipantHearingOriginal.Cases.First().Name,
                    Number = _updatedExistingParticipantHearingOriginal.Cases.First().Number,
                },
                Endpoints = _updatedExistingParticipantHearingOriginal.Endpoints
                    .Select(EditEndpointRequestMapper.MapFrom)
                    .ToList(),
                Participants = _updatedExistingParticipantHearingOriginal.Participants
                    .Select(EditParticipantRequestMapper.MapFrom)
                    .ToList()
            };
        }

 
        [Test]
        public void Should_return_false_if_HearingRoomName_is_not_changed()
        {
            _editHearingRequest.HearingRoomName = "Updated HearingRoomName";
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_HearingVenueName_is_changed()
        {
            _editHearingRequest.HearingRoomName = "Updated HearingVenueName";
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_OtherInformation_is_changed()
        {
            _editHearingRequest.OtherInformation = "Updated OtherInformation";

            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_ScheduledDuration_is_changed()
        {
            _editHearingRequest.ScheduledDuration =
                _updatedExistingParticipantHearingOriginal.ScheduledDuration + 1;
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_QuestionnaireNotRequired_is_changed()
        {
            _editHearingRequest.QuestionnaireNotRequired =
                !_updatedExistingParticipantHearingOriginal.QuestionnaireNotRequired;
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_endpoint_count_is_changed()
        {
            _editHearingRequest.Endpoints.Add(new EditEndpointRequest
            {
                Id = Guid.NewGuid(),
                DisplayName = "test",
                DefenceAdvocateContactEmail = Guid.NewGuid().ToString(),
            });
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_endpoint_displayName_is_changed()
        {
            _editHearingRequest.Endpoints.First().DisplayName = "test1";
            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_endpoint_removed()
        {
            _updatedExistingParticipantHearingOriginal.Endpoints.Add(new EndpointResponse
            {
                Id = Guid.NewGuid(),
                DisplayName = "test",
                DefenceAdvocateId = Guid.NewGuid(),
            });
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_endpoint_defenceAdvocateUsername_is_changed()
        {
            _updatedExistingParticipantHearingOriginal.Endpoints.First().DefenceAdvocateId = Guid.NewGuid();
            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_when_participant_removed()
        {
            _updatedExistingParticipantHearingOriginal.Participants.Add(new ParticipantResponse { Id = Guid.NewGuid() });
            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_true_when_participant_added()
        {
            _editHearingRequest.Participants.Add(new EditParticipantRequest { Id = Guid.NewGuid() });
            Assert.True(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
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
        public void Should_return_false_if_participant_displayName_changed()
        {
            _editHearingRequest.Participants.First().DisplayName = "DisplayName changed";

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_participant_lastName_changed()
        {
            _editHearingRequest.Participants.First().LastName = "LastName changed";

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_throws_InvalidOperationException()
        {
            _updatedExistingParticipantHearingOriginal.Cases = new List<CaseResponse>();
            Assert.Throws<InvalidOperationException>(() => _service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_case_name_is_different()
        {
            _editHearingRequest.Case.Name = "Updated Case Name";

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_case_number_is_different()
        {
            _editHearingRequest.Case.Number = "Updated Number";
            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public void Should_return_false_if_ScheduledDateTime_is_different()
        {
            _editHearingRequest.ScheduledDateTime = DateTime.Now;

            Assert.False(_service.IsAddingParticipantOnly(_editHearingRequest,
                _updatedExistingParticipantHearingOriginal));
        }

        [Test]
        public async Task Should_process_participants()
        {
            var existingParticipants = new List<UpdateParticipantRequest>();
            var newParticipants = new List<BookingsApi.Contract.Requests.ParticipantRequest>();
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
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing);

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
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing);

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
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing);

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
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing);

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
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing);

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
            var newParticipant = await _service.ProcessNewParticipant(_hearing.Id, participant, removedParticipantIds, _hearing);

            // Assert
            newParticipant.Should().NotBeNull();
            newParticipant.Username.Should().NotBe(participant.ContactEmail);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void IsUpdatingJudge_Should_return_correct_assertion(bool shouldUpdateJudge)
        {
            // Arrange
            var editHearing = _editHearingRequest;
            editHearing.Participants.Add(new EditParticipantRequest
            {
                ContactEmail = "Judge@court.com",
                HearingRoleName = "Judge"
            });
            var hearing = InitHearing();
            if(shouldUpdateJudge)
                hearing.Participants
                    .First(x => x.UserRoleName == "Judge")
                    .ContactEmail = "Different.Judge@court.com";
            //Act
            var response = _service.IsUpdatingJudge(editHearing, hearing);
            //Assert
            response.Should().Be(shouldUpdateJudge);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void IsUpdatingJudge_should_be_correct_when_comparing_optional_contact_details(bool shouldUpdateJudge)
        {
            // Arrange
            var editHearing = _editHearingRequest;
            editHearing.Participants.Add(new EditParticipantRequest
            {
                ContactEmail = "Judge@court.com",
                HearingRoleName = "Judge"
            });
            editHearing.OtherInformation = "JudgePhone|loremIpsum";
            var hearing = InitHearing();
            hearing.OtherInformation = "JudgePhone|loremIpsum";
            if(shouldUpdateJudge)
                hearing.OtherInformation = "JudgePhone|loremIpsum2";
            //Act
            var response = _service.IsUpdatingJudge(editHearing, hearing);
            //Assert
            response.Should().Be(shouldUpdateJudge);
        }

        [Test]
        public void IsUpdatingJudge_should_be_false_when_judge_isempty()
        {
            // Arrange
            var editHearing = _editHearingRequest;
            editHearing.Participants.Add(new EditParticipantRequest
            {
                ContactEmail = "Judge@court.com",
                HearingRoleName = "xyz"
            });
            editHearing.OtherInformation = "JudgePhone|loremIpsum";
            var hearing = InitHearing();
            hearing.Participants.Remove(hearing.Participants.Single(x => x.HearingRoleName == "Judge"));
            hearing.OtherInformation = "JudgePhone|loremIpsum";
            //Act
            var response = _service.IsUpdatingJudge(editHearing, hearing);
            //Assert
            response.Should().Be(false);
        }

        [Test]
        public void IsUpdatingJudge_should_be_false_when_other_info_empty()
        {
            // Arrange
            var editHearing = _editHearingRequest;
            editHearing.Participants.Add(new EditParticipantRequest
            {
                ContactEmail = "Judge@court.com",
                HearingRoleName = "xyz"
            });
            editHearing.OtherInformation = string.Empty;
            var hearing = InitHearing();
            hearing.Participants.Remove(hearing.Participants.Single(x => x.HearingRoleName == "Judge"));
            hearing.OtherInformation = string.Empty;
            //Act
            var response = _service.IsUpdatingJudge(editHearing, hearing);
            //Assert
            response.Should().Be(false);
        }
        [Test]
        public void SetJudgeInformationForUpdate_should_extract_OtherInformation_and_update_EditRequest_participant()
        {
            // Arrange
            var editHearing = _editHearingRequest;
            editHearing.Participants.Add(new EditParticipantRequest
            {
                ContactEmail = "Judge@court.com",
                HearingRoleName = "Judge"
            });
            editHearing.OtherInformation = "|JudgeEmail|judge@email.com|JudgePhone|0123454678";
            //Act
            _service.SetJudgeInformationForUpdate(editHearing);
            //Assert
            var judge = editHearing.Participants.First(e => e.HearingRoleName == "Judge");
            judge.TelephoneNumber.Should().Be("0123454678");
            judge.ContactEmail.Should().Be("judge@email.com");
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
    }
}