using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using AcceptanceTests.Common.Api.Clients;
using AcceptanceTests.Common.Api.Requests;
using AcceptanceTests.Common.Api.Uris;
using AcceptanceTests.Common.Api.Users;
using AcceptanceTests.Common.Configuration.Users;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.VideoAPI.Client;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class RemoveDataHooks
    {
        private const int Timeout = 30;
        private string _clerkUsername;
        private string _bookingApiUrl;
        private string _bookingsApiBearerToken;
        private string _videoApiUrl;
        private string _videoApiBearerToken;

        [BeforeScenario(Order = (int)HooksSequence.RemoveDataHooks)]
        [AfterScenario]
        public void RemovePreviousHearings(TestContext context)
        {
            _clerkUsername = UserManager.GetClerkUser(context.UserAccounts).Username;
            _bookingApiUrl = context.AdminWebConfig.VhServices.BookingsApiUrl;
            _bookingsApiBearerToken = context.Tokens.BookingsApiBearerToken;
            _videoApiUrl = context.AdminWebConfig.VhServices.VideoApiUrl;
            _videoApiBearerToken = context.Tokens.VideoApiBearerToken;
            ClearHearingsForClerk();
            ClearClosedConferencesForClerk();
        }

        [AfterScenario]
        public static void RemoveNewUsersFromAad(TestContext context)
        {
            if (context.Test?.HearingParticipants == null) return;
            if (context.Test.HearingParticipants.Count <= 0 || !context.Test.SubmittedAndCreatedNewAadUsers) return;
            foreach (var participant in context.Test.HearingParticipants.Where(participant => participant.DisplayName.StartsWith(context.Test.TestData.AddParticipant.Participant.NewUserPrefix)))
            {
                if (UserHasBeenCreatedInAad(context))
                    PollToDeleteTheNewUser(context.AdminWebConfig.VhServices.UserApiUrl, context.Tokens.UserApiBearerToken, participant.Username)
                        .Should().BeTrue("New user was deleted from AAD");
            }
        }

        private static bool UserHasBeenCreatedInAad(TestContext context)
        {
            return new UserApiManager(context.AdminWebConfig.VhServices.UserApiUrl, context.Tokens.UserApiBearerToken).ParticipantsExistInAad(context.UserAccounts, Timeout);
        }

        private static bool PollToDeleteTheNewUser(string vhServicesUserApiUrl, string userApiBearerToken, string username)
        {
            for (var i = 0; i < Timeout; i++)
            {
                var response = new UserApiManager(vhServicesUserApiUrl, userApiBearerToken).DeleteUserFromAad(username);
                if (response.StatusCode == HttpStatusCode.NoContent)
                {
                    return true;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }
            return false;
        }

        private void ClearHearingsForClerk()
        {
            var endpoint = new HearingsEndpoints().GetHearingsByUsername(_clerkUsername);
            var request = new RequestBuilder().Get(endpoint);
            var client = new ApiClient(_bookingApiUrl, _bookingsApiBearerToken).GetClient();
            var response = new RequestExecutor(request).SendToApi(client);
            var hearings = RequestHelper.DeserialiseSnakeCaseJsonToResponse<List<HearingDetailsResponse>>(response.Content);
            if (hearings == null) return;
            foreach (var hearing in hearings)
            {
                DeleteTheHearing(hearing.Id);
            }
        }
        private void DeleteTheHearing(Guid? hearingId)
        {
            var endpoint = new BookingsApiUriFactory().HearingsEndpoints.RemoveHearing(hearingId);
            var request = new RequestBuilder().Delete(endpoint);
            var client = new ApiClient(_bookingApiUrl, _bookingsApiBearerToken).GetClient();
            var response = new RequestExecutor(request).SendToApi(client);
            response.IsSuccessful.Should().BeTrue($"HearingDetails {hearingId} has been deleted. Status {response.StatusCode}. {response.Content}");
        }

        private void ClearClosedConferencesForClerk()
        {
            var endpoint = new VideoApiUriFactory().ConferenceEndpoints.GetTodaysConferences;
            var request = new RequestBuilder().Get(endpoint);
            var client = new ApiClient(_videoApiUrl, _videoApiBearerToken).GetClient();
            var response = new RequestExecutor(request).SendToApi(client);
            var todaysConferences = RequestHelper.DeserialiseSnakeCaseJsonToResponse<List<ConferenceSummaryResponse>>(response.Content);
            if (todaysConferences == null) return;

            foreach (var conference in todaysConferences)
            {
                if (!ClerkUserIsAParticipantInTheConference(conference.Participants, _clerkUsername)) continue;

                var hearingId = GetTheHearingIdFromTheConference(conference.Id);

                if (HearingHasNotBeenDeletedAlready(hearingId) && !hearingId.Equals(Guid.Empty))
                    DeleteTheHearing(hearingId);

                if (ConferenceHasNotBeenDeletedAlready(conference.Id))
                    DeleteTheConference(conference.Id);
            }
        }
        private static bool ClerkUserIsAParticipantInTheConference(IEnumerable<ParticipantSummaryResponse> participants, string username)
        {
            return participants.Any(x => x.Username.ToLower().Equals(username.ToLower()));
        }

        private Guid GetTheHearingIdFromTheConference(Guid? conferenceId)
        {
            if (conferenceId == null)
                throw new DataMisalignedException("Conference Id must be set");

            var endpoint = new VideoApiUriFactory().ConferenceEndpoints.GetConferenceDetailsById((Guid)conferenceId);
            var request = new RequestBuilder().Get(endpoint);
            var client = new ApiClient(_videoApiUrl, _videoApiBearerToken).GetClient();
            var response = new RequestExecutor(request).SendToApi(client);
            var conference = RequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(response.Content);

            if (conference.Hearing_id == null)
                return Guid.Empty;

            return (Guid)conference.Hearing_id;
        }

        private bool HearingHasNotBeenDeletedAlready(Guid hearingId)
        {
            var endpoint = new BookingsApiUriFactory().HearingsEndpoints.GetHearingDetailsById(hearingId);
            var request = new RequestBuilder().Get(endpoint);
            var client = new ApiClient(_bookingApiUrl, _bookingsApiBearerToken).GetClient();
            var response = new RequestExecutor(request).SendToApi(client);
            return !response.StatusCode.Equals(HttpStatusCode.NotFound);
        }

        private bool ConferenceHasNotBeenDeletedAlready(Guid? conferenceId)
        {
            if (conferenceId == null)
                throw new DataMisalignedException("Conference Id must be set");

            var endpoint = new VideoApiUriFactory().ConferenceEndpoints.GetConferenceDetailsById((Guid)conferenceId);
            var request = new RequestBuilder().Get(endpoint);
            var client = new ApiClient(_videoApiUrl, _videoApiBearerToken).GetClient();
            var response = new RequestExecutor(request).SendToApi(client);
            return !response.StatusCode.Equals(HttpStatusCode.NotFound);
        }

        private void DeleteTheConference(Guid? conferenceId)
        {
            var endpoint = new VideoApiUriFactory().ConferenceEndpoints.RemoveConference(conferenceId);
            var request = new RequestBuilder().Get(endpoint);
            var client = new ApiClient(_videoApiUrl, _videoApiBearerToken).GetClient();
            new RequestExecutor(request).SendToApi(client);
        }
    }
}
