using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Models;
using AdminWebsite.Services;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;
using Microsoft.Extensions.Options;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Services
{
    public class HearingServiceTests
    {
        private const string ExpectedTeleConferencePhoneNumber = "expected_conference_phone_number";
        private const string ExpectedTeleConferenceId = "expected_conference_phone_id";
        private HearingDetailsResponseV2 _hearing;
        private AutoMock _mocker;
        private HearingsService _service;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IOptions<VodafoneConfiguration>>().Setup(opt => opt.Value).Returns(new VodafoneConfiguration
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
                .Setup(c => c.GetHearingsByGroupIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(new List<HearingDetailsResponseV2> { _hearing });
            
            _service = _mocker.Create<HearingsService>();
            _hearing = InitHearing();
        }

        [Test]
        public async Task Should_process_participants()
        {
            var existingParticipants = new List<UpdateParticipantRequestV2>();
            var newParticipants = new List<ParticipantRequestV2>();
            var removedParticipantIds = new List<Guid>();
            var linkedParticipants = new List<LinkedParticipantRequestV2>();

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdV2Async(_hearing.GroupId.Value))
                .ReturnsAsync(new List<HearingDetailsResponseV2> { _hearing });

            await _service.ProcessParticipantsV2(_hearing.Id, existingParticipants, newParticipants, removedParticipantIds, linkedParticipants);

            _mocker.Mock<IBookingsApiClient>()
                .Verify(
                    x => x.UpdateHearingParticipantsV2Async(_hearing.Id, It.Is<UpdateHearingParticipantsRequestV2>(requestV2 =>
                        requestV2.ExistingParticipants == existingParticipants
                        && requestV2.NewParticipants == newParticipants
                        && requestV2.RemovedParticipantIds == removedParticipantIds
                        && requestV2.LinkedParticipants == linkedParticipants)), Times.Once);
        }

        private static HearingDetailsResponseV2 InitHearing()
        {
            var cases = new List<CaseResponseV2> { new() { Name = "Test", Number = "123456" } };
            var rep = Builder<ParticipantResponseV2>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Representative")
                .Build();
            var ind = Builder<ParticipantResponseV2>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Individual")
                .Build();
            var joh = Builder<ParticipantResponseV2>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Judicial Office Holder")
                .Build();
            var judge = Builder<ParticipantResponseV2>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Judge")
                .With(x => x.ContactEmail = "Judge@court.com")
                .With(x => x.HearingRoleName = "Judge")
                .Build();
            var staffMember = Builder<ParticipantResponseV2>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = "Staff Member")
                .Build();

            return Builder<HearingDetailsResponseV2>.CreateNew()
                .With(h => h.Participants = new List<ParticipantResponseV2> { rep, ind, joh, judge, staffMember })
                .With(x => x.Cases = cases)
                .With(x => x.Id = Guid.NewGuid())
                .Build();
        }
    }
}