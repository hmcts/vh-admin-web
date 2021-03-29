using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Extensions;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Services.Models;
using Microsoft.Extensions.Logging;
using NotificationApi.Client;
using NotificationApi.Contract.Requests;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using AddEndpointRequest = AdminWebsite.BookingsAPI.Client.AddEndpointRequest;
using EndpointResponse = AdminWebsite.BookingsAPI.Client.EndpointResponse;
using ParticipantRequest = AdminWebsite.BookingsAPI.Client.ParticipantRequest;
using UpdateEndpointRequest = AdminWebsite.BookingsAPI.Client.UpdateEndpointRequest;
using UpdateParticipantRequest = AdminWebsite.BookingsAPI.Client.UpdateParticipantRequest;

namespace AdminWebsite.Services
{
    public interface IHearingsService
    {
        Task AssignParticipantToCorrectGroups(HearingDetailsResponse hearing,
            Dictionary<string, User> newUsernameAdIdDict);

        void AssignEndpointDefenceAdvocates(List<EndpointRequest> endpointsWithDa,
            IReadOnlyCollection<ParticipantRequest> participants);

        Task SendNewUserEmailParticipants(HearingDetailsResponse hearing,
            Dictionary<string, User> newUsernameAdIdDict);

        Task SendHearingUpdateEmail(HearingDetailsResponse originalHearing, HearingDetailsResponse updatedHearing, List<ParticipantResponse> participants = null);

        /// <summary>
        /// This will notify all participants (excluding the judge) a hearing has been booked.
        /// Not to be confused with the "confirmed process".
        /// </summary>
        /// <param name="hearing"></param>
        /// <param name="participants"></param>
        /// <returns></returns>
        Task SendHearingConfirmationEmail(HearingDetailsResponse hearing, List<ParticipantResponse> participants = null);
        Task SendMultiDayHearingConfirmationEmail(HearingDetailsResponse hearing, int days);

        Task SendHearingReminderEmail(HearingDetailsResponse hearing);

        Task ProcessNewParticipants(Guid hearingId, EditParticipantRequest participant, HearingDetailsResponse hearing,
            Dictionary<string, User> usernameAdIdDict, List<ParticipantRequest> newParticipantList);

        Task ProcessExistingParticipants(Guid hearingId, HearingDetailsResponse hearing,
            EditParticipantRequest participant);

        Task ProcessEndpoints(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing,
            List<ParticipantRequest> newParticipantList);

        Task UpdateParticipantLinks(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing);

        Task AddParticipantLinks(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing);

        Task SaveNewParticipants(Guid hearingId, List<ParticipantRequest> newParticipantList);

        Task<ConferenceDetailsResponse> GetConferenceDetailsByHearingIdWithRetry(Guid hearingId, string errorMessage);

        Task<ConferenceDetailsResponse> GetConferenceDetailsByHearingId(Guid hearingId);
    }

    public class HearingsService : IHearingsService
    {
        private readonly IPollyRetryService _pollyRetryService;
        private readonly IUserAccountService _userAccountService;
        private readonly INotificationApiClient _notificationApiClient;
        private readonly IVideoApiClient _videoApiClient;
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly ILogger<HearingsService> _logger;

        public HearingsService(IPollyRetryService pollyRetryService, IUserAccountService userAccountService,
            INotificationApiClient notificationApiClient, IVideoApiClient videoApiClient, IBookingsApiClient bookingsApiClient, ILogger<HearingsService> logger)
        {
            _pollyRetryService = pollyRetryService;
            _userAccountService = userAccountService;
            _notificationApiClient = notificationApiClient;
            _videoApiClient = videoApiClient;
            _bookingsApiClient = bookingsApiClient;
            _logger = logger;
        }

        public async Task AssignParticipantToCorrectGroups(HearingDetailsResponse hearing, Dictionary<string, User> newUsernameAdIdDict)
        {
            var participantGroup = newUsernameAdIdDict.Select(pair => new
            {
                pair,
                participant = hearing.Participants.FirstOrDefault(x => x.Username == pair.Key)
            });

            if (!newUsernameAdIdDict.Any() || participantGroup.Any(x => x.participant == null))
            {
                _logger.LogDebug($"{nameof(AssignParticipantToCorrectGroups)} - No users in dictionary for hearingId: {hearing.Id}");
                return;
            }

            var tasks = participantGroup.Select(t => AssignParticipantToGroupWithRetry(t.pair.Key, t.pair.Value.UserName, t.participant.User_role_name, hearing.Id))
                .ToList();

            await Task.WhenAll(tasks);
        }

        public void AssignEndpointDefenceAdvocates(List<EndpointRequest> endpointsWithDa, IReadOnlyCollection<ParticipantRequest> participants)
        {
            // update the username of defence advocate 
            foreach (var endpoint in endpointsWithDa)
            {
                _logger.LogDebug("Attempting to find defence advocate {DefenceAdvocate} for endpoint {Endpoint}",
                    endpoint.Defence_advocate_username, endpoint.Display_name);
                var defenceAdvocate = participants.Single(x =>
                    x.Username.Equals(endpoint.Defence_advocate_username,
                        StringComparison.CurrentCultureIgnoreCase));
                endpoint.Defence_advocate_username = defenceAdvocate.Username;
            }
        }

        public async Task SendNewUserEmailParticipants(HearingDetailsResponse hearing,
            Dictionary<string, User> newUsernameAdIdDict)
        {
            foreach (var item in newUsernameAdIdDict)
            {
                if (!string.IsNullOrEmpty(item.Value?.Password))
                {
                    var participant = hearing.Participants.FirstOrDefault(x => x.Username == item.Key);

                    if (participant == null) continue;

                    var request = AddNotificationRequestMapper.MapToNewUserNotification(hearing.Id, participant, item.Value.Password);
                    // Send a notification only for the newly created users
                    await _notificationApiClient.CreateNewNotificationAsync(request);
                }
            }
        }

        public async Task SendHearingUpdateEmail(HearingDetailsResponse originalHearing, HearingDetailsResponse updatedHearing, List<ParticipantResponse> participants = null)
        {
            if (updatedHearing.IsGenericHearing())
            {
                return;
            }

            var @case = updatedHearing.Cases.First();
            var caseName = @case.Name;
            var caseNumber = @case.Number;

            var participantsToEmail = participants ?? updatedHearing.Participants;
            if (!updatedHearing.DoesJudgeEmailExist() || originalHearing.Confirmed_date == null || originalHearing.Group_id != originalHearing.Id)
            {
                participantsToEmail = participantsToEmail
                    .Where(x => !x.User_role_name.Contains("Judge", StringComparison.CurrentCultureIgnoreCase))
                    .ToList();
            }
            var requests = participantsToEmail
                .Select(participant =>
                    AddNotificationRequestMapper.MapToHearingAmendmentNotification(updatedHearing, participant,
                        caseName, caseNumber, originalHearing.Scheduled_date_time, updatedHearing.Scheduled_date_time))
                .ToList();

            foreach (var request in requests)
            {
                await _notificationApiClient.CreateNewNotificationAsync(request);
            }
        }

        public async Task SendHearingConfirmationEmail(HearingDetailsResponse hearing, List<ParticipantResponse> participants = null)
        {
            if (hearing.IsGenericHearing())
            {
                return;
            }

            var participantsToEmail = participants ?? hearing.Participants;

            var requests = participantsToEmail
                .Where(x => !x.User_role_name.Contains("Judge", StringComparison.CurrentCultureIgnoreCase))
                .Select(participant => AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, participant))
                .ToList();

            foreach (var request in requests)
            {
                await _notificationApiClient.CreateNewNotificationAsync(request);
            }
        }

        public async Task SendMultiDayHearingConfirmationEmail(HearingDetailsResponse hearing, int days)
        {
            if (hearing.IsGenericHearing())
            {
                return;
            }

            var requests = hearing.Participants
                .Where(x => !x.User_role_name.Contains("Judge", StringComparison.CurrentCultureIgnoreCase))
                .Select(participant => AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(hearing, participant, days))
                .ToList();

            foreach (var request in requests)
            {
                await _notificationApiClient.CreateNewNotificationAsync(request);
            }
        }

        public async Task SendHearingReminderEmail(HearingDetailsResponse hearing)
        {
            if (hearing.IsGenericHearing())
            {
                return;
            }

            if (hearing.DoesJudgeEmailExist())
            {
                await SendJudgeConfirmationEmail(hearing);
            }

            var requests = hearing.Participants
                .Where(x => !x.User_role_name.Contains("Judge", StringComparison.CurrentCultureIgnoreCase))
                .Select(participant => AddNotificationRequestMapper.MapToHearingReminderNotification(hearing, participant))
                .ToList();

            await Task.WhenAll(requests.Select(_notificationApiClient.CreateNewNotificationAsync));
        }

        private async Task SendJudgeConfirmationEmail(HearingDetailsResponse hearing)
        {
            var hearings = await _bookingsApiClient.GetHearingsByGroupIdAsync(hearing.Group_id.Value);
            AddNotificationRequest request;

            if (hearings.Count == 1)
            {
                var judge = hearing.Participants
                    .First(x => x.User_role_name.Contains("Judge", StringComparison.CurrentCultureIgnoreCase));
                request = AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, judge);
            }
            else
            {
                var singleHearing = hearings.First();
                var judge = singleHearing.Participants.First(x => x.User_role_name.Contains("Judge", StringComparison.CurrentCultureIgnoreCase));
                request = AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(singleHearing, judge, hearings.Count);
            }

            if (request.ContactEmail != null)
            {
                await _notificationApiClient.CreateNewNotificationAsync(request);
            }
        }

        public async Task<ConferenceDetailsResponse> GetConferenceDetailsByHearingIdWithRetry(Guid hearingId, string errorMessage)
        {
            try
            {
                var details = await _pollyRetryService.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
                (
                    6, _ => TimeSpan.FromSeconds(8),
                    retryAttempt =>
                        _logger.LogWarning(
                            "Failed to retrieve conference details from the VideoAPi for hearingId {Hearing}. Retrying attempt {RetryAttempt}", hearingId, retryAttempt),
                    videoApiResponseObject => !videoApiResponseObject.HasValidMeetingRoom(),
                    () => _videoApiClient.GetConferenceByHearingRefIdAsync(hearingId, false)
                );
                return details;
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, $"{errorMessage}: {ex.Message}");
            }

            return new ConferenceDetailsResponse();
        }

        public async Task<ConferenceDetailsResponse> GetConferenceDetailsByHearingId(Guid hearingId)
        {
            return await _videoApiClient.GetConferenceByHearingRefIdAsync(hearingId, false);
        }

        public async Task ProcessNewParticipants(Guid hearingId, EditParticipantRequest participant, HearingDetailsResponse hearing,
            Dictionary<string, User> usernameAdIdDict, List<ParticipantRequest> newParticipantList)
        {
            // Add a new participant
            // Map the request except the username
            var newParticipant = NewParticipantRequestMapper.MapTo(participant);
            // Judge is manually created in AD, no need to create one
            if (participant.CaseRoleName == "Judge")
            {
                if (hearing.Participants != null && hearing.Participants.Any(p => p.Username.Equals(participant.ContactEmail)))
                {
                    //If the judge already exists in the database, there is no need to add again.
                    return;
                }

                newParticipant.Username = participant.ContactEmail;
            }
            else
            {
                // Update the request with newly created user details in AD
                var user = await _userAccountService.UpdateParticipantUsername(newParticipant);
                usernameAdIdDict.Add(newParticipant.Username, user);
            }

            _logger.LogDebug("Adding participant {Participant} to hearing {Hearing}",
                newParticipant.Display_name, hearingId);
            newParticipantList.Add(newParticipant);
        }

        public async Task ProcessExistingParticipants(Guid hearingId, HearingDetailsResponse hearing,
            EditParticipantRequest participant)
        {
            var existingParticipant = hearing.Participants.FirstOrDefault(p => p.Id.Equals(participant.Id));
            if (existingParticipant != null)
            {
                if (existingParticipant.User_role_name == "Individual" ||
                    existingParticipant.User_role_name == "Representative")
                {
                    //Update participant
                    _logger.LogDebug("Updating existing participant {Participant} in hearing {Hearing}",
                        existingParticipant.Id, hearingId);
                    var updateParticipantRequest = UpdateParticipantRequestMapper.MapTo(participant);
                    await _bookingsApiClient.UpdateParticipantDetailsAsync(hearingId, participant.Id.Value,
                        updateParticipantRequest);
                }
                else if (existingParticipant.User_role_name == "Judge")
                {
                    //Update Judge
                    _logger.LogDebug("Updating judge {Participant} in hearing {Hearing}",
                        existingParticipant.Id, hearingId);
                    var updateParticipantRequest = new UpdateParticipantRequest
                    {
                        Display_name = participant.DisplayName
                    };
                    await _bookingsApiClient.UpdateParticipantDetailsAsync(hearingId, participant.Id.Value,
                        updateParticipantRequest);
                }
            }
        }

        public async Task ProcessEndpoints(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing,
            List<ParticipantRequest> newParticipantList)
        {
            if (hearing.Endpoints == null)
            {
                return;
            }

            var listOfEndpointsToDelete = hearing.Endpoints.Where(e => request.Endpoints.All(re => re.Id != e.Id));
            await RemoveEndpointsFromHearing(hearing, listOfEndpointsToDelete);

            foreach (var endpoint in request.Endpoints)
            {
                var epToUpdate = newParticipantList
                    .Find(p => p.Contact_email.Equals(endpoint.DefenceAdvocateUsername,
                        StringComparison.CurrentCultureIgnoreCase));
                if (epToUpdate != null)
                {
                    endpoint.DefenceAdvocateUsername = epToUpdate.Username;
                }

                if (endpoint.Id.HasValue)
                {
                    await UpdateEndpointInHearing(hearingId, hearing, endpoint);
                }
                else
                {
                    await AddEndpointToHearing(hearingId, hearing, endpoint);
                }
            }
        }

        private async Task RemoveEndpointsFromHearing(HearingDetailsResponse hearing, IEnumerable<EndpointResponse> listOfEndpointsToDelete)
        {
            foreach (var endpointToDelete in listOfEndpointsToDelete)
            {
                _logger.LogDebug("Removing endpoint {Endpoint} - {EndpointDisplayName} from hearing {Hearing}",
                    endpointToDelete.Id, endpointToDelete.Display_name, hearing.Id);
                await _bookingsApiClient.RemoveEndPointFromHearingAsync(hearing.Id, endpointToDelete.Id);
            }
        }

        private async Task AddEndpointToHearing(Guid hearingId, HearingDetailsResponse hearing,
            EditEndpointRequest endpoint)
        {
            _logger.LogDebug("Adding endpoint {EndpointDisplayName} to hearing {Hearing}",
                endpoint.DisplayName, hearingId);
            var addEndpointRequest = new AddEndpointRequest
            {
                Display_name = endpoint.DisplayName,
                Defence_advocate_username = endpoint.DefenceAdvocateUsername
            };
            await _bookingsApiClient.AddEndPointToHearingAsync(hearing.Id, addEndpointRequest);
        }

        private async Task UpdateEndpointInHearing(Guid hearingId, HearingDetailsResponse hearing,
            EditEndpointRequest endpoint)
        {
            var existingEndpointToEdit = hearing.Endpoints.FirstOrDefault(e => e.Id.Equals(endpoint.Id));
            if (existingEndpointToEdit == null ||
                existingEndpointToEdit.Display_name == endpoint.DisplayName &&
                existingEndpointToEdit.Defence_advocate_id.ToString() == endpoint.DefenceAdvocateUsername)
                return;

            _logger.LogDebug("Updating endpoint {Endpoint} - {EndpointDisplayName} in hearing {Hearing}",
                existingEndpointToEdit.Id, existingEndpointToEdit.Display_name, hearingId);
            var updateEndpointRequest = new UpdateEndpointRequest
            {
                Display_name = endpoint.DisplayName,
                Defence_advocate_username = endpoint.DefenceAdvocateUsername
            };
            await _bookingsApiClient.UpdateDisplayNameForEndpointAsync(hearing.Id, endpoint.Id.Value,
                updateEndpointRequest);
        }

        public async Task UpdateParticipantLinks(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing)
        {
            if (!request.Participants.SelectMany(x => x.LinkedParticipants).Any())
            {
                return;
            }

            var existingParticipantWithLinks = request.Participants.Where(x => x.LinkedParticipants.Any() && x.Id.HasValue);
            foreach (var participantRequest in existingParticipantWithLinks)
            {
                await UpdateLinksForExistingParticipant(request, hearing, participantRequest);
            }
        }

        private async Task UpdateLinksForExistingParticipant(EditHearingRequest request, HearingDetailsResponse hearing, EditParticipantRequest requestParticipant)
        {
            var participant = hearing.Participants.First(x => x.Id == requestParticipant.Id);
            var linkedParticipantsInRequest = request.Participants.First(x => x.Id == participant.Id)
                .LinkedParticipants.ToList();

            var requests =
                BuildLinkedParticipantRequestForExistingParticipant(hearing, participant, linkedParticipantsInRequest);

            var updateParticipantRequest = new UpdateParticipantRequest
            {
                Linked_participants = requests,
                Display_name = requestParticipant.DisplayName,
                Organisation_name = requestParticipant.OrganisationName,
                Representee = requestParticipant.Representee,
                Telephone_number = requestParticipant.TelephoneNumber,
                Title = requestParticipant.Title
            };

            await _bookingsApiClient.UpdateParticipantDetailsAsync(hearing.Id, participant.Id,
                updateParticipantRequest);
        }

        private List<LinkedParticipantRequest> BuildLinkedParticipantRequestForExistingParticipant(HearingDetailsResponse hearing, ParticipantResponse participant, List<LinkedParticipant> linkedParticipantsInRequest)
        {
            var requests = new List<LinkedParticipantRequest>();

            var newLinks = linkedParticipantsInRequest.Where(x => x.LinkedId == Guid.Empty)
                .Select(lp => new LinkedParticipantRequest
                {
                    Participant_contact_email = lp.ParticipantContactEmail,
                    Linked_participant_contact_email = lp.LinkedParticipantContactEmail
                });
            requests.AddRange(newLinks);

            var existingLinksToUpdate = linkedParticipantsInRequest.Where(x => x.LinkedId != Guid.Empty && !HasExistingLink(x, participant));

            var existingLinks = existingLinksToUpdate.Select(linkedParticipantInRequest => 
                hearing.Participants.First(x => x.Id == linkedParticipantInRequest.LinkedId))
                .Select(linkedParticipant => new LinkedParticipantRequest
                {
                    Participant_contact_email = participant.Contact_email, Linked_participant_contact_email = linkedParticipant.Contact_email
                });

            requests.AddRange(existingLinks);
            return requests;
        }

        private bool HasExistingLink(LinkedParticipant linkedParticipantInRequest, ParticipantResponse participant)
        {
            var linkedId = linkedParticipantInRequest.LinkedId;
            var existingLink = false;

            if (participant.Linked_participants != null)
            {
                existingLink = participant.Linked_participants.Exists(x => x.Linked_id == linkedId);
            }

            return existingLink;
        }

        public async Task SaveNewParticipants(Guid hearingId, List<ParticipantRequest> newParticipantList)
        {
            if (newParticipantList.Any())
            {
                _logger.LogDebug("Saving new participants {ParticipantCount} to hearing {Hearing}",
                    newParticipantList.Count, hearingId);
                await _bookingsApiClient.AddParticipantsToHearingAsync(hearingId, new AddParticipantsToHearingRequest()
                {
                    Participants = newParticipantList
                });
            }
        }

        private async Task AssignParticipantToGroupWithRetry(string username, string userId, string userRoleName, Guid hearingId)
        {
            await _pollyRetryService.WaitAndRetryAsync<Exception, Task>
            (
                4, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                retryAttempt => _logger.LogDebug($"{nameof(AssignParticipantToCorrectGroups)} - Failed to add username: {username} userId {userId} to role: {userRoleName} on AAD for hearingId: {hearingId}. Retrying attempt {retryAttempt}"),
                result => result.IsFaulted,
                async () =>
                {
                    _logger.LogDebug($"{nameof(AssignParticipantToCorrectGroups)} - Adding username: {username} userId {userId} to role: {userRoleName} on AAD for hearingId: {hearingId}");
                    await _userAccountService.AssignParticipantToGroup(userId, userRoleName);
                    _logger.LogDebug($"{nameof(AssignParticipantToCorrectGroups)} - Added username: {username} userId {userId} to role: {userRoleName} on AAD for hearingId: {hearingId}");
                    return Task.CompletedTask;
                }
            );
        }

        public async Task AddParticipantLinks(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing)
        {
            if (request.Participants.Any(x => x.LinkedParticipants != null && x.LinkedParticipants.Count > 0))
            {
                foreach (var requestParticipant in request.Participants.Where(x => x.LinkedParticipants.Any()))
                {
                    if (requestParticipant.Id != null) continue;
                    var requests = new List<LinkedParticipantRequest>();
                    foreach (var lp in requestParticipant.LinkedParticipants)
                    {
                        requests.Add(new LinkedParticipantRequest
                        {
                            Participant_contact_email = lp.ParticipantContactEmail,
                            Linked_participant_contact_email = lp.LinkedParticipantContactEmail
                        });
                    }
                    var updateParticipantRequest = new UpdateParticipantRequest
                    {
                        Linked_participants = requests,
                        Display_name = requestParticipant.DisplayName,
                        Organisation_name = requestParticipant.OrganisationName,
                        Representee = requestParticipant.Representee,
                        Telephone_number = requestParticipant.TelephoneNumber,
                        Title = requestParticipant.Title
                    };
                    var newParticipant = hearing.Participants.First(p => p.Contact_email == requestParticipant.ContactEmail);
                    await _bookingsApiClient.UpdateParticipantDetailsAsync(hearingId, newParticipant.Id, updateParticipantRequest);
                }
            }
        }
    }
}
