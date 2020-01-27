using System;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Requests;
using AcceptanceTests.Common.Api.Users;
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
        private readonly UserApiManager _userApiManager;
        private readonly BookingsApiManager _bookingsApiManager;

        public DataHooks(TestContext context)
        {
            _c = context;
            _bookingsApiManager = new BookingsApiManager(_c.AdminWebConfig.VhServices.BookingsApiUrl, _c.Tokens.BookingsApiBearerToken);
            _userApiManager = new UserApiManager(_c.AdminWebConfig.VhServices.UserApiUrl, _c.Tokens.UserApiBearerToken);
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

            foreach (var response in UserManager.GetNonClerkParticipantUsers(_c.UserAccounts).Select(participant => _userApiManager.GetUser(participant.Username)))
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

            var hearingResponse = _bookingsApiManager.CreateHearing(hearingRequest);
            hearingResponse.StatusCode.Should().Be(HttpStatusCode.Created);
            var hearing = RequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(hearingResponse.Content);
            hearing.Should().NotBeNull();

            ParticipantExistsInTheDb(hearing.Id).Should().BeTrue();
            _userApiManager.ParticipantsExistInAad(_c.UserAccounts, Timeout).Should().BeTrue();
        }

        private bool ParticipantExistsInTheDb(Guid hearingId)
        {
            var hearingResponse = _bookingsApiManager.GetHearing(hearingId);
            var hearing = RequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(hearingResponse.Content);
            hearing.Should().NotBeNull();
            return hearing.Participants.Any(x =>
                x.Username.ToLower().Equals(UserManager.GetDefaultParticipantUser(_c.UserAccounts).Username.ToLower()));
        }
    }
}
