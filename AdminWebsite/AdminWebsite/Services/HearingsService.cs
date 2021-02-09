using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Extensions;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Services.Models;
using AdminWebsite.VideoAPI.Client;
using Microsoft.Extensions.Logging;
using NotificationApi.Client;
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

        Task EmailParticipants(HearingDetailsResponse hearing,
            Dictionary<string, User> newUsernameAdIdDict);

        Task ProcessNewParticipants(Guid hearingId, EditParticipantRequest participant, HearingDetailsResponse hearing,
            Dictionary<string, User> usernameAdIdDict, List<ParticipantRequest> newParticipantList);

        Task ProcessExistingParticipants(Guid hearingId, HearingDetailsResponse hearing,
            EditParticipantRequest participant);

        Task ProcessEndpoints(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing,
            List<ParticipantRequest> newParticipantList);

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

        public HearingsService(IPollyRetryService pollyRetryService,IUserAccountService userAccountService, 
            INotificationApiClient notificationApiClient, IVideoApiClient videoApiClient,IBookingsApiClient bookingsApiClient, ILogger<HearingsService> logger)
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
                _logger.LogDebug("Attempting to find defence advocate {da} for endpoint {ep}",
                    endpoint.Defence_advocate_username, endpoint.Display_name);
                var defenceAdvocate = participants.Single(x =>
                    x.Username.Equals(endpoint.Defence_advocate_username,
                        StringComparison.CurrentCultureIgnoreCase));
                endpoint.Defence_advocate_username = defenceAdvocate.Username;
            }
        }

        public async Task EmailParticipants(HearingDetailsResponse hearing,
            Dictionary<string, User> newUsernameAdIdDict)
        {
            foreach (var item in newUsernameAdIdDict)
            {
                if (!string.IsNullOrEmpty(item.Value?.Password))
                {
                    var participant = hearing.Participants.FirstOrDefault(x => x.Username == item.Key);

                    if (participant == null) continue;

                    var request = AddNotificationRequestMapper.MapTo(hearing.Id, participant, item.Value.Password);
                    // Send a notification only for the newly created users
                    await _notificationApiClient.CreateNewNotificationAsync(request);
                }
            }
        }

        public async Task<ConferenceDetailsResponse> GetConferenceDetailsByHearingIdWithRetry(Guid hearingId, string errorMessage)
        {
            try
            {
                var details =  await _pollyRetryService.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
                (
                    6, _ => TimeSpan.FromSeconds(8),
                    retryAttempt =>
                        _logger.LogWarning(
                            $"Failed to retrieve conference details from the VideoAPi for hearingId {hearingId}. Retrying attempt {retryAttempt}"),
                    videoApiResponseObject => videoApiResponseObject.HasInvalidMeetingRoom(),
                    () => _videoApiClient.GetConferenceByHearingRefIdAsync(hearingId, true)
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
            return await _videoApiClient.GetConferenceByHearingRefIdAsync(hearingId, true);
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

            _logger.LogDebug("Adding participant {participant} to hearing {hearing}",
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
                    _logger.LogDebug("Updating existing participant {participant} in hearing {hearing}",
                        existingParticipant.Id, hearingId);
                    var updateParticipantRequest = UpdateParticipantRequestMapper.MapTo(participant);
                    await _bookingsApiClient.UpdateParticipantDetailsAsync(hearingId, participant.Id.Value,
                        updateParticipantRequest);
                }
                else if (existingParticipant.User_role_name == "Judge")
                {
                    //Update Judge
                    _logger.LogDebug("Updating judge {participant} in hearing {hearing}",
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
                    _logger.LogDebug("Removing endpoint {endpoint} - {endpointDisplayName} from hearing {hearing}",
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
                        _logger.LogDebug("Adding endpoint {endpointDisplayName} to hearing {hearing}",
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
                            _logger.LogDebug("Updating endpoint {endpoint} - {endpointDisplayName} in hearing {hearing}",
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

        public async Task SaveNewParticipants(Guid hearingId, List<ParticipantRequest> newParticipantList)
        {
            if (newParticipantList.Any())
            {
                _logger.LogDebug("Saving new participants {participantCount} to hearing {hearing}",
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
    }
}
