using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.Api.Users;
using AcceptanceTests.Common.Configuration.Users;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.VideoAPI.Client;
using FluentAssertions;
using Newtonsoft.Json;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class RemoveDataHooks
    {
        private const int Timeout = 30;
        private string _clerkUsername;

        [BeforeScenario(Order = (int)HooksSequence.RemoveDataHooks)]
        [AfterScenario]
        public void RemovePreviousHearings(TestContext context, ScenarioContext scenario)
        {
            if (scenario.ScenarioInfo.Tags.Contains("KeepDataAfterTest")) return;
            _clerkUsername = UserManager.GetClerkUser(context.UserAccounts).Username;
            ClearHearingsForClerk(context.Apis.BookingsApi);
            ClearClosedConferencesForClerk(context.Apis.BookingsApi, context.Apis.VideoApi);
        }

        [AfterScenario(Order = (int)HooksSequence.RemoveNewUsersHooks)]
        public static void RemoveNewUsersFromAad(TestContext context)
        {
            if (context.Test?.HearingParticipants == null) return;
            if (context.Test.HearingParticipants.Count <= 0 || !context.Test.SubmittedAndCreatedNewAadUsers) return;
            foreach (var participant in context.Test.HearingParticipants.Where(participant => participant.DisplayName.StartsWith(context.Test.TestData.AddParticipant.Participant.NewUserPrefix)))
            {
                if (UserHasBeenCreatedInAad(context))
                    PollToDeleteTheNewUser(context.WebConfig.VhServices.UserApiUrl, context.Tokens.UserApiBearerToken, participant.Username)
                        .Should().BeTrue("New user was deleted from AAD");
            }
        }

        [AfterScenario(Order = (int)HooksSequence.RemoveAudioFiles)]
        public static async Task RemoveAudioFile(TestContext context, ScenarioContext scenario)
        {
            if (!scenario.ScenarioInfo.Tags.Contains("AudioRecording")) return;
            if (context.AzureStorage != null)
                await context.AzureStorage.RemoveAudioFileFromStorage();
        }

        private static bool UserHasBeenCreatedInAad(TestContext context)
        {
            return context.Apis.UserApi.ParticipantsExistInAad(context.UserAccounts, Timeout);
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

        private void ClearHearingsForClerk(BookingsApiManager bookingsApi)
        {
            var response = bookingsApi.GetHearingsForUsername(_clerkUsername);
            var hearings = RequestHelper.Deserialise<List<HearingDetailsResponse>>(response.Content);
            if (hearings == null) return;
            foreach (var hearing in hearings)
            {
                DeleteTheHearing(bookingsApi, hearing.Id);
            }
        }
        private static void DeleteTheHearing(BookingsApiManager bookingsApi, Guid hearingId)
        {
            var response = bookingsApi.DeleteHearing(hearingId);
            response.IsSuccessful.Should().BeTrue($"HearingDetails {hearingId} has been deleted. Status {response.StatusCode}. {response.Content}");
        }

        private void ClearClosedConferencesForClerk(BookingsApiManager bookingsApi, VideoApiManager videoApi)
        {
            var response = videoApi.GetConferencesForTodayJudge(_clerkUsername);
            try
            {
                var todaysConferences = RequestHelper.Deserialise<List<ConferenceForJudgeResponse>>(response.Content);
                if (todaysConferences == null) return;

                foreach (var conference in todaysConferences)
                {
                    var hearingId = GetTheHearingIdFromTheConference(videoApi, conference.Id);

                    if (HearingHasNotBeenDeletedAlready(bookingsApi, hearingId) && !hearingId.Equals(Guid.Empty))
                        DeleteTheHearing(bookingsApi, hearingId);

                    if (ConferenceHasNotBeenDeletedAlready(videoApi, conference.Id))
                        DeleteTheConference(videoApi, conference.Id);
                }
            }
            catch (JsonReaderException e)
            {
                NUnit.Framework.TestContext.WriteLine($"Failed to parse list of conferences with error '{e}'");
            }
        }

        private static Guid GetTheHearingIdFromTheConference(VideoApiManager videoApi, Guid conferenceId)
        {
            var response = videoApi.GetConferenceByConferenceId(conferenceId);
            var conference = RequestHelper.Deserialise<ConferenceDetailsResponse>(response.Content);
            return conference.Hearing_id;
        }

        private static bool HearingHasNotBeenDeletedAlready(BookingsApiManager bookingsApi, Guid hearingId)
        {
            var response = bookingsApi.GetHearing(hearingId);
            return !response.StatusCode.Equals(HttpStatusCode.NotFound);
        }

        private static bool ConferenceHasNotBeenDeletedAlready(VideoApiManager videoApi, Guid conferenceId)
        {
            var response = videoApi.GetConferenceByConferenceId(conferenceId);
            return !response.StatusCode.Equals(HttpStatusCode.NotFound);
        }

        private static void DeleteTheConference(VideoApiManager videoApi, Guid conferenceId)
        {
            videoApi.DeleteConference(conferenceId);
        }
    }
}
