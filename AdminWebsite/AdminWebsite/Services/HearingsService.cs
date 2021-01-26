using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Services.Models;
using AdminWebsite.VideoAPI.Client;
using Microsoft.Extensions.Logging;
using NotificationApi.Client;
using NotificationApi.Contract;
using NotificationApi.Contract.Requests;
using UpdateParticipantRequest = AdminWebsite.BookingsAPI.Client.UpdateParticipantRequest;

namespace AdminWebsite.Services
{
    public class HearingsService : IHearingsService
    {
        private readonly ILogger<HearingsService> _logger;
        private readonly INotificationApiClient _notificationApiClient;
        private readonly IPollyRetryService _pollyRetryService;
        private readonly IUserAccountService _userAccountService;
        private readonly IVideoApiClient _videoApiClient;


        public HearingsService(ILogger<HearingsService> logger,INotificationApiClient notificationApiClient, IPollyRetryService pollyRetryService,
            IUserAccountService userAccountService, IVideoApiClient videoApiClient)
        {
            _logger = logger;
            _notificationApiClient = notificationApiClient;
            _pollyRetryService = pollyRetryService;
            _userAccountService = userAccountService;
            _videoApiClient = videoApiClient;
        }

        public async Task EmailParticipants(HearingDetailsResponse hearing, Dictionary<string, User> newUsernameAdIdDict)
        {
            foreach (var item in newUsernameAdIdDict)
            {
                if (!string.IsNullOrEmpty(item.Value?.Password))
                {
                    var participant = hearing.Participants.FirstOrDefault(x => x.Username == item.Key);
                    var request = MapAddNotificationRequest(hearing.Id, participant, item.Value.Password);
                    // Send a notification only for the newly created users
                    await _notificationApiClient.CreateNewNotificationAsync(request);
                }
            }
        }

        public async Task AssignParticipantToCorrectGroups(HearingDetailsResponse hearing, Dictionary<string, User> newUsernameAdIdDict)
        {
            if (!newUsernameAdIdDict.Any())
            {
                _logger.LogDebug($"{nameof(AssignParticipantToCorrectGroups)} - No users in dictionary for hearingId: {hearing.Id}");
                return;
            }

            var tasks = newUsernameAdIdDict.Select(pair => new
                {
                    pair,
                    participant = hearing.Participants.FirstOrDefault(x => x.Username == pair.Key)
                })
                .Select(t => AssignParticipantToGroupWithRetry(t.pair.Key, t.pair.Value.UserName, t.participant.User_role_name, hearing.Id))
                .ToList();

            await Task.WhenAll(tasks);
        }

        public async Task<UpdateBookingReferenceResult> UpdateBookingReference(Guid hearingId, string errorMessage)
        {
            var response = new UpdateBookingReferenceResult();
            try
            {
                response.UpdateResponse = await _pollyRetryService.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
                (
                    6, _ => TimeSpan.FromSeconds(8),
                    retryAttempt => _logger.LogWarning($"Failed to retrieve conference details from the VideoAPi for hearingId {hearingId}. Retrying attempt {retryAttempt}"),
                    videoApiResponseObject => !ConferenceExistsWithMeetingRoom(videoApiResponseObject),
                    () => _videoApiClient.GetConferenceByHearingRefIdAsync(hearingId)
                );

                if (ConferenceExistsWithMeetingRoom(response.UpdateResponse))
                {
                    response.Successful = true;
                    return response;
                }
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, $"{errorMessage}: {ex.Message}");
            }

            response.Successful = false;
            return response;
        }

        public bool ConferenceExistsWithMeetingRoom(ConferenceDetailsResponse conference)
        {
            var success = !(conference?.Meeting_room == null
                            || string.IsNullOrWhiteSpace(conference.Meeting_room.Admin_uri)
                            || string.IsNullOrWhiteSpace(conference.Meeting_room.Participant_uri)
                            || string.IsNullOrWhiteSpace(conference.Meeting_room.Judge_uri)
                            || string.IsNullOrWhiteSpace(conference.Meeting_room.Pexip_node));
            return success;
        }

        public async Task PopulateUserIdsAndUsernames(IList<BookingsAPI.Client.ParticipantRequest> participants,
            Dictionary<string, User> usernameAdIdDict)
        {
            _logger.LogDebug("Assigning HMCTS usernames for participants");
            foreach (var participant in participants)
            {
                // set the participant username according to AD
                User user;
                if (string.IsNullOrWhiteSpace(participant.Username))
                {
                    _logger.LogDebug("No username provided in booking for participant {email}. Checking AD by contact email",
                        participant.Contact_email);
                    user = await _userAccountService.UpdateParticipantUsername(participant);
                }
                else
                {
                    // get user
                    _logger.LogDebug(
                        "Username provided in booking for participant {email}. Getting id for username {username}",
                        participant.Contact_email, participant.Username);
                    var adUserId = await _userAccountService.GetAdUserIdForUsername(participant.Username);
                    user = new User { UserName = adUserId };
                }
                // username's participant will be set by this point
                usernameAdIdDict[participant.Username!] = user;
            }
        }

        public void AssignEndpointDefenceAdvocates(List<EndpointRequest> endpointsWithDa, IReadOnlyCollection<BookingsAPI.Client.ParticipantRequest> participants)
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

        public UpdateHearingRequest MapHearingUpdateRequest(EditHearingRequest editHearingRequest, string updatedBy)
        {
            var updateHearingRequest = new UpdateHearingRequest
            {
                Hearing_room_name = editHearingRequest.HearingRoomName,
                Hearing_venue_name = editHearingRequest.HearingVenueName,
                Other_information = editHearingRequest.OtherInformation,
                Scheduled_date_time = editHearingRequest.ScheduledDateTime,
                Scheduled_duration = editHearingRequest.ScheduledDuration,
                Updated_by = updatedBy,
                Cases = new List<CaseRequest>
                {
                    new CaseRequest
                    {
                        Name = editHearingRequest.Case.Name,
                        Number = editHearingRequest.Case.Number
                    }
                },
                Questionnaire_not_required = false,
                Audio_recording_required = editHearingRequest.AudioRecordingRequired
            };
            return updateHearingRequest;
        }

        public UpdateParticipantRequest MapUpdateParticipantRequest(EditParticipantRequest participant)
        {
            var updateParticipantRequest = new UpdateParticipantRequest
            {
                Title = participant.Title,
                Display_name = participant.DisplayName,
                Organisation_name = participant.OrganisationName,
                Telephone_number = participant.TelephoneNumber,
                Representee = participant.Representee,
            };
            return updateParticipantRequest;
        }

        public BookingsAPI.Client.ParticipantRequest MapNewParticipantRequest(EditParticipantRequest participant)
        {
            var newParticipant = new BookingsAPI.Client.ParticipantRequest
            {
                Case_role_name = participant.CaseRoleName,
                Contact_email = participant.ContactEmail,
                Display_name = participant.DisplayName,
                First_name = participant.FirstName,
                Last_name = participant.LastName,
                Hearing_role_name = participant.HearingRoleName,
                Middle_names = participant.MiddleNames,
                Representee = participant.Representee,
                Telephone_number = participant.TelephoneNumber,
                Title = participant.Title,
                Organisation_name = participant.OrganisationName,
            };
            return newParticipant;
        }

        private async Task AssignParticipantToGroupWithRetry(string username, string userId, string userRoleName, Guid hearingId)
        {
            await _pollyRetryService.WaitAndRetryAsync<Exception, Task>
            (
                3, _ => TimeSpan.FromSeconds(3),
                retryAttempt => _logger.LogDebug($"{nameof(AssignParticipantToGroupWithRetry)} - Failed to add username: {username} userId {userId} to role: {userRoleName} on AAD for hearingId: {hearingId}. Retrying attempt {retryAttempt}"),
                result => result.IsFaulted,
                async () =>
                {
                    await _userAccountService.AssignParticipantToGroup(userId, userRoleName);
                    _logger.LogDebug($"{nameof(AssignParticipantToGroupWithRetry)} - Added username: {username} userId {userId} to role: {userRoleName} on AAD for hearingId: {hearingId}");
                    return Task.CompletedTask;
                }
            );
        }

        private AddNotificationRequest MapAddNotificationRequest(Guid hearingId, ParticipantResponse participant, string password)
        {
            var parameters = new Dictionary<string, string>
            {
                {"name", $"{participant.First_name} {participant.Last_name}"},
                {"username", $"{participant.Username}"},
                {"random password", $"{password}"}
            };
            var addNotificationRequest = new AddNotificationRequest
            {
                HearingId = hearingId,
                MessageType = MessageType.Email,
                ContactEmail = participant.Contact_email,
                NotificationType = participant.User_role_name == "Individual" ? NotificationType.CreateIndividual : NotificationType.CreateRepresentative,
                ParticipantId = participant.Id,
                PhoneNumber = participant.Telephone_number,
                Parameters = parameters,
            };
            return addNotificationRequest;
        }
    }
}
