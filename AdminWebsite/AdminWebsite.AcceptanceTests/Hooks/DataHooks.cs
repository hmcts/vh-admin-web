using System;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.Api.Requests;
using AcceptanceTests.Common.Configuration.Users;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.BookingsAPI.Client;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class DataHooks
    {
        private const int Timeout = 60;
        private readonly TestContext _c;

        public DataHooks(TestContext context)
        {
            _c = context;
        }

        [BeforeScenario(Order = (int)HooksSequence.DataHooks)]
        public void AddExistingUsers()
        {
            var exist = CheckIfParticipantsAlreadyExistInTheDb();

            if (!exist)
                CreateHearing();
        }

        private bool CheckIfParticipantsAlreadyExistInTheDb()
        {
            var exist = false;

            foreach (var response in UserManager.GetNonClerkParticipantUsers(_c.UserAccounts).Select(participant => _c.Apis.UserApi.GetUser(participant.Username)))
            {
                exist = response.StatusCode == HttpStatusCode.OK;
            }
            return exist;
        }

        private void CreateHearing()
        {
            var hearingRequest = new HearingRequestBuilder()
                .WithUserAccounts(_c.UserAccounts)
                .Build();

            var hearingResponse = _c.Apis.BookingsApi.CreateHearing(hearingRequest);
            hearingResponse.StatusCode.Should().Be(HttpStatusCode.Created);
            var hearing = RequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(hearingResponse.Content);
            hearing.Should().NotBeNull();

            ParticipantExistsInTheDb(hearing.Id).Should().BeTrue();
            _c.Apis.UserApi.ParticipantsExistInAad(_c.UserAccounts, Timeout).Should().BeTrue();
        }

        private bool ParticipantExistsInTheDb(Guid hearingId)
        {
            var hearingResponse = _c.Apis.BookingsApi.GetHearing(hearingId);
            var hearing = RequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(hearingResponse.Content);
            hearing.Should().NotBeNull();
            return hearing.Participants.Any(x =>
                x.Username.ToLower().Equals(UserManager.GetDefaultParticipantUser(_c.UserAccounts).Username.ToLower()));
        }
    }
}
