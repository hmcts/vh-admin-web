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
using VideoApi.Client;
using VideoApi.Contract.Responses;
using AddEndpointRequest = AdminWebsite.BookingsAPI.Client.AddEndpointRequest;
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

        Task SendHearingUpdateEmail(HearingDetailsResponse originalHearing, HearingDetailsResponse updatedHearing);

        /// <summary>
        /// This will notify all participants (excluding the judge) a hearing has been booked.
        /// Not to be confused with the "confirmed process".
        /// </summary>
        /// <param name="hearing"></param>
        /// <returns></returns>
        Task SendHearingConfirmationEmail(HearingDetailsResponse hearing);

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

        public async Task SendHearingUpdateEmail(HearingDetailsResponse originalHearing, HearingDetailsResponse updatedHearing)
        {
            if (updatedHearing.IsGenericHearing())
            {
                return;
            }
            var @case = updatedHearing.Cases.First();
            var caseName = @case.Name;
            var caseNumber = @case.Number;
            var requests = updatedHearing.Participants
                .Where(x => !x.User_role_name.Contains("Judge", StringComparison.CurrentCultureIgnoreCase))
                .Select(participant =>
                    AddNotificationRequestMapper.MapToHearingAmendmentNotification(updatedHearing.Id, participant,
                        caseName, caseNumber, originalHearing.Scheduled_date_time, updatedHearing.Scheduled_date_time))
                .ToList();
            foreach (var request in requests)
            {
                await _notificationApiClient.CreateNewNotificationAsync(request);
            }
        }

        public async Task SendHearingConfirmationEmail(HearingDetailsResponse hearing)
        {
            if (hearing.IsGenericHearing())
            {
                return;
            }
            var requests = hearing.Participants
                .Where(x => !x.User_role_name.Contains("Judge", StringComparison.CurrentCultureIgnoreCase))
                .Select(participant => AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, participant))
                .ToList();
            foreach (var request in requests)
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
                    videoApiResponseObject => videoApiResponseObject.HasInvalidMeetingRoom(),
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
            if (hearing.Endpoints != null)
            {
                var listOfEndpointsToDelete = hearing.Endpoints.Where(e => request.Endpoints.All(re => re.Id != e.Id));
                foreach (var endpointToDelete in listOfEndpointsToDelete)
                {
                    _logger.LogDebug("Removing endpoint {Endpoint} - {EndpointDisplayName} from hearing {Hearing}",
                        endpointToDelete.Id, endpointToDelete.Display_name, hearingId);
                    await _bookingsApiClient.RemoveEndPointFromHearingAsync(hearing.Id, endpointToDelete.Id);
                }

                foreach (var endpoint in request.Endpoints)
                {
                    var epToUpdate = newParticipantList
                        .Find(p => p.Contact_email.Equals(endpoint.DefenceAdvocateUsername,
                            StringComparison.CurrentCultureIgnoreCase));
                    if (epToUpdate != null)
                    {
                        endpoint.DefenceAdvocateUsername = epToUpdate.Username;
                    }

                    if (!endpoint.Id.HasValue)
                    {
                        _logger.LogDebug("Adding endpoint {EndpointDisplayName} to hearing {Hearing}",
                            endpoint.DisplayName, hearingId);
                        var addEndpointRequest = new AddEndpointRequest
                        { Display_name = endpoint.DisplayName, Defence_advocate_username = endpoint.DefenceAdvocateUsername };
                        await _bookingsApiClient.AddEndPointToHearingAsync(hearing.Id, addEndpointRequest);
                    }
                    else
                    {
                        var existingEndpointToEdit = hearing.Endpoints.FirstOrDefault(e => e.Id.Equals(endpoint.Id));
                        if (existingEndpointToEdit != null && (existingEndpointToEdit.Display_name != endpoint.DisplayName ||
                                                               existingEndpointToEdit.Defence_advocate_id.ToString() !=
                                                               endpoint.DefenceAdvocateUsername))
                        {
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
                    }
                }
            }
        }

        public async Task UpdateParticipantLinks(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing)
        {
            if (request.Participants.Any(x => x.LinkedParticipants != null && x.LinkedParticipants.Count > 0))
            {
                foreach (var requestParticipant in request.Participants.Where(x => x.LinkedParticipants.Any()))
                {
                    if (requestParticipant.Id == null) continue;
                    var participant = hearing.Participants.First(x => x.Id == requestParticipant.Id);
                    var linkedParticipantsInRequest = request.Participants.First(x => x.Id == participant.Id)
                        .LinkedParticipants.ToList();

                    var requests = new List<LinkedParticipantRequest>();

                    foreach (var linkedParticipantInRequest in linkedParticipantsInRequest)
                    {
                        var linkedId = linkedParticipantInRequest.LinkedId;
                        var existingLink = false;

                        if (participant.Linked_participants != null)
                        {
                            existingLink = participant.Linked_participants.Exists(x => x.Linked_id == linkedId);
                        }

                        if (!existingLink)
                        {
                            var linkedParticipant =
                                hearing.Participants.First(x => x.Id == linkedParticipantInRequest.LinkedId);
                            requests.Add(new LinkedParticipantRequest
                            {
                                Participant_contact_email = participant.Contact_email,
                                Linked_participant_contact_email = linkedParticipant.Contact_email
                            });
                        }
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

                    await _bookingsApiClient.UpdateParticipantDetailsAsync(hearingId, participant.Id,
                        updateParticipantRequest);
                }
            }
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
                3, _ => TimeSpan.FromSeconds(3),
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
            // var updatedHearing = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
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
