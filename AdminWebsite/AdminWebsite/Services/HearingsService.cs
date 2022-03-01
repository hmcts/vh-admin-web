using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Extensions;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Services.Models;
using BookingsApi.Client;
using BookingsApi.Contract.Configuration;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NotificationApi.Client;
using NotificationApi.Contract.Requests;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Consts;
using AddEndpointRequest = BookingsApi.Contract.Requests.AddEndpointRequest;
using EndpointResponse = BookingsApi.Contract.Responses.EndpointResponse;
using ParticipantRequest = BookingsApi.Contract.Requests.ParticipantRequest;
using UpdateEndpointRequest = BookingsApi.Contract.Requests.UpdateEndpointRequest;
using UpdateParticipantRequest = BookingsApi.Contract.Requests.UpdateParticipantRequest;

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

        Task SendHearingUpdateEmail(HearingDetailsResponse originalHearing, HearingDetailsResponse updatedHearing,
            List<ParticipantResponse> participants = null);

        /// <summary>
        /// This will notify all participants (excluding the judge) a hearing has been booked.
        /// Not to be confused with the "confirmed process".
        /// </summary>
        /// <param name="hearing"></param>
        /// <param name="participants"></param>
        /// <returns></returns>
        Task EditHearingSendConfirmation(HearingDetailsResponse hearing,
            List<ParticipantResponse> participants = null);

        /// <summary>
        /// This will notify all participants (excluding the judge and staff member) a hearing has been booked.
        /// Not to be confused with the "confirmed process".
        /// </summary>
        /// <param name="hearing"></param>
        /// <param name="participants"></param>
        /// <returns></returns>
        Task NewHearingSendConfirmation(HearingDetailsResponse hearing,
            List<ParticipantResponse> participants = null);

        Task SendMultiDayHearingConfirmationEmail(HearingDetailsResponse hearing, int days);

        Task SendHearingReminderEmail(HearingDetailsResponse hearing);

        Task SendJudgeConfirmationEmail(HearingDetailsResponse hearing);

        Task ProcessParticipants(Guid hearingId, List<UpdateParticipantRequest> existingParticipants, List<ParticipantRequest> newParticipants,
            List<Guid> removedParticipantIds, List<LinkedParticipantRequest> linkedParticipants);

        Task<ParticipantRequest> ProcessNewParticipant(Guid hearingId, EditParticipantRequest participant,
            List<Guid> removedParticipantIds, HearingDetailsResponse hearing,
            Dictionary<string, User> usernameAdIdDict);

        Task ProcessEndpoints(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing,
            List<ParticipantRequest> newParticipantList);

        Task UpdateParticipantLinks(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing);

        Task AddParticipantLinks(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing);

        Task SaveNewParticipants(Guid hearingId, List<ParticipantRequest> newParticipantList);

        bool IsAddingParticipantOnly(EditHearingRequest editHearingRequest,
            HearingDetailsResponse hearingDetailsResponse);
        bool IsAddingOrRemovingStaffMember(EditHearingRequest editHearingRequest,
            HearingDetailsResponse hearingDetailsResponse);

        Task ProcessGenericEmail(HearingDetailsResponse hearing, List<ParticipantResponse> participants);

        Task<TeleConferenceDetails> GetTelephoneConferenceDetails(Guid hearingId);

    }

    public class HearingsService : IHearingsService
    {
        private readonly IPollyRetryService _pollyRetryService;
        private readonly IUserAccountService _userAccountService;
        private readonly INotificationApiClient _notificationApiClient;
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly ILogger<HearingsService> _logger;
        private readonly IConferenceDetailsService _conferenceDetailsService;
        private readonly IFeatureToggles _featureToggles;
        private readonly KinlyConfiguration _kinlyConfiguration;
#pragma warning disable S107
        public HearingsService(IPollyRetryService pollyRetryService, IUserAccountService userAccountService,
            INotificationApiClient notificationApiClient, IVideoApiClient videoApiClient,
            IBookingsApiClient bookingsApiClient, ILogger<HearingsService> logger, IConferenceDetailsService conferenceDetailsService, IOptions<KinlyConfiguration> kinlyOptions, IFeatureToggles featureToggles)
        {
            _pollyRetryService = pollyRetryService;
            _userAccountService = userAccountService;
            _notificationApiClient = notificationApiClient;
            _bookingsApiClient = bookingsApiClient;
            _logger = logger;
            _conferenceDetailsService = conferenceDetailsService;
            _featureToggles = featureToggles;
            _kinlyConfiguration = kinlyOptions.Value;
        }
#pragma warning restore S107
        public async Task AssignParticipantToCorrectGroups(HearingDetailsResponse hearing,
            Dictionary<string, User> newUsernameAdIdDict)
        {
            var participantGroup = newUsernameAdIdDict.Select(pair => new
            {
                pair,
                participant = hearing.Participants.FirstOrDefault(x => x.Username == pair.Key)
            });

            if (!newUsernameAdIdDict.Any() || participantGroup.Any(x => x.participant == null))
            {
                _logger.LogDebug(
                    $"{nameof(AssignParticipantToCorrectGroups)} - No users in dictionary for hearingId: {hearing.Id}");
                return;
            }

            var tasks = participantGroup.Select(t =>
                    AssignParticipantToGroupWithRetry(t.pair.Key, t.pair.Value.UserId, t.participant.UserRoleName,
                        hearing.Id))
                .ToList();

            await Task.WhenAll(tasks);
        }

        public void AssignEndpointDefenceAdvocates(List<EndpointRequest> endpointsWithDa,
            IReadOnlyCollection<ParticipantRequest> participants)
        {
            // update the username of defence advocate 
            foreach (var endpoint in endpointsWithDa)
            {
                _logger.LogDebug("Attempting to find defence advocate {DefenceAdvocate} for endpoint {Endpoint}",
                    endpoint.DefenceAdvocateUsername, endpoint.DisplayName);
                var defenceAdvocate = participants.Single(x =>
                    x.Username.Equals(endpoint.DefenceAdvocateUsername,
                        StringComparison.CurrentCultureIgnoreCase));
                endpoint.DefenceAdvocateUsername = defenceAdvocate.Username;
            }
        }

        public bool IsAddingParticipantOnly(EditHearingRequest editHearingRequest,
            HearingDetailsResponse hearingDetailsResponse)
        {
            var originalParticipants = hearingDetailsResponse.Participants.Where(x=>x.HearingRoleName != HearingRoleName.StaffMember)
                .Select(EditParticipantRequestMapper.MapFrom).ToList();
            var requestParticipants = editHearingRequest.Participants.FindAll(x=>x.HearingRoleName != HearingRoleName.StaffMember);
            var hearingCase = hearingDetailsResponse.Cases.First();
            var originalEndpoints = hearingDetailsResponse.Endpoints == null
                ? new List<EditEndpointRequest>()
                : hearingDetailsResponse.Endpoints
                    .Select(EditEndpointRequestMapper.MapFrom).ToList();
            var requestEndpoints = editHearingRequest.Endpoints ?? new List<EditEndpointRequest>();
            var addedParticipant = GetAddedParticipant(originalParticipants, requestParticipants);

            return addedParticipant.Any() &&
                   editHearingRequest.HearingRoomName == hearingDetailsResponse.HearingRoomName &&
                   editHearingRequest.HearingVenueName == hearingDetailsResponse.HearingVenueName &&
                   editHearingRequest.OtherInformation == hearingDetailsResponse.OtherInformation &&
                   editHearingRequest.ScheduledDateTime == hearingDetailsResponse.ScheduledDateTime &&
                   editHearingRequest.ScheduledDuration == hearingDetailsResponse.ScheduledDuration &&
                   editHearingRequest.QuestionnaireNotRequired == hearingDetailsResponse.QuestionnaireNotRequired &&
                   hearingCase.Name == editHearingRequest.Case.Name &&
                   hearingCase.Number == editHearingRequest.Case.Number &&
                   HasEndpointsBeenChanged(originalEndpoints, requestEndpoints);
        }

        public bool IsAddingOrRemovingStaffMember(EditHearingRequest editHearingRequest,
            HearingDetailsResponse hearingDetailsResponse)
        {
            var existingStaffMember =
                hearingDetailsResponse.Participants.FirstOrDefault(
                    x => x.HearingRoleName == HearingRoleName.StaffMember);
            var newStaffMember =
                editHearingRequest.Participants.FirstOrDefault(x => x.HearingRoleName == HearingRoleName.StaffMember);
            return (existingStaffMember == null && newStaffMember != null) ||
                   (existingStaffMember != null && newStaffMember == null);
        }

        public bool HasEndpointsBeenChanged(List<EditEndpointRequest> originalEndpoints,
            List<EditEndpointRequest> requestEndpoints)
        {
            return originalEndpoints.Except(requestEndpoints, EditEndpointRequest.EditEndpointRequestComparer)
                .ToList()
                .Count == 0 && requestEndpoints
                .Except(originalEndpoints, EditEndpointRequest.EditEndpointRequestComparer)
                .ToList()
                .Count == 0;
        }
        public List<EditParticipantRequest> GetAddedParticipant(List<EditParticipantRequest> originalParticipants,
            List<EditParticipantRequest> requestParticipants)
        {
            return originalParticipants
                .Except(requestParticipants, EditParticipantRequest.EditParticipantRequestComparer)
                .ToList()
                .Count == 0
                ? requestParticipants
                    .Except(originalParticipants, EditParticipantRequest.EditParticipantRequestComparer)
                    .ToList()
                : new List<EditParticipantRequest>();
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

                    var request =
                        AddNotificationRequestMapper.MapToNewUserNotification(hearing.Id, participant,
                            item.Value.Password);
                    // Send a notification only for the newly created users
                    await _notificationApiClient.CreateNewNotificationAsync(request);
                }
            }
        }

        public async Task SendHearingUpdateEmail(HearingDetailsResponse originalHearing,
            HearingDetailsResponse updatedHearing, List<ParticipantResponse> participants = null)
        {
            if (updatedHearing.IsGenericHearing())
            {
                return;
            }

            var @case = updatedHearing.Cases.First();
            var caseName = @case.Name;
            var caseNumber = @case.Number;

            var participantsToEmail = participants ?? updatedHearing.Participants;
            if (!updatedHearing.DoesJudgeEmailExist() || originalHearing.ConfirmedDate == null ||
                originalHearing.GroupId != originalHearing.Id)
            {
                participantsToEmail = participantsToEmail
                    .Where(x => !x.UserRoleName.Contains("Judge", StringComparison.CurrentCultureIgnoreCase))
                    .ToList();
            }

            var requests = participantsToEmail
                .Select(participant =>
                    AddNotificationRequestMapper.MapToHearingAmendmentNotification(updatedHearing, participant,
                        caseName, caseNumber, originalHearing.ScheduledDateTime, updatedHearing.ScheduledDateTime))
                .ToList();

            await CreateNotifications(requests);
        }

        public async Task NewHearingSendConfirmation(HearingDetailsResponse hearing, List<ParticipantResponse> participants = null)
        {
            if (hearing.IsGenericHearing())
            {
                await ProcessGenericEmail(hearing, participants);
                return;
            }

            var participantsToEmail = participants ?? hearing.Participants;

            List<AddNotificationRequest> requests;
            if (_featureToggles.BookAndConfirmToggle())
            {
                //The toggle switched on removes the where userRole != Judge LINQ clause
                requests = participantsToEmail
                    .Where(y => !y.UserRoleName.Contains(RoleNames.StaffMember,
                        StringComparison.CurrentCultureIgnoreCase))
                    .Select(participant =>
                        AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, participant))
                    .ToList();
            }
            else
            {
                //previous implementation to switch back to
                requests = participantsToEmail
                    .Where(x => !x.UserRoleName.Contains(RoleNames.Judge, StringComparison.CurrentCultureIgnoreCase))
                    .Where(y => !y.UserRoleName.Contains(RoleNames.StaffMember, StringComparison.CurrentCultureIgnoreCase))
                    .Select(participant =>
                        AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, participant)) 
                    .ToList();
            }

            if (hearing.TelephoneParticipants != null)
            {
                var telephoneRequests = hearing.TelephoneParticipants
                    .Where(x => !x.HearingRoleName.Contains(RoleNames.Judge, StringComparison.CurrentCultureIgnoreCase))
                    .Select(participant =>
                        AddNotificationRequestMapper.MapToTelephoneHearingConfirmationNotification(hearing, participant))
                    .ToList();

                requests.AddRange(telephoneRequests);
            }

            await CreateNotifications(requests);
        }

        public async Task EditHearingSendConfirmation(HearingDetailsResponse hearing,
            List<ParticipantResponse> participants = null)
        {
            if (hearing.IsGenericHearing())
            {
                await ProcessGenericEmail(hearing, participants);
                return;
            }
            var participantsToEmail = participants ?? hearing.Participants;
            var filteredParticipants = participantsToEmail
                .Where(x => !x.UserRoleName.Contains(RoleNames.Judge, StringComparison.CurrentCultureIgnoreCase));

            if (hearing.Status != BookingsApi.Contract.Enums.BookingStatus.Created)
            {
                filteredParticipants = filteredParticipants
                .Where(x => !x.UserRoleName.Contains(RoleNames.StaffMember, StringComparison.CurrentCultureIgnoreCase));
            }

            var notificationRequests = filteredParticipants
                 .Select(participant =>
                     AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, participant))
                 .ToList();
            if (hearing.TelephoneParticipants != null)
            {
                var telephoneRequests = hearing.TelephoneParticipants
                    .Where(x => !x.HearingRoleName.Contains(RoleNames.Judge, StringComparison.CurrentCultureIgnoreCase))
                    .Select(participant =>
                        AddNotificationRequestMapper.MapToTelephoneHearingConfirmationNotification(hearing, participant))
                    .ToList();

                notificationRequests.AddRange(telephoneRequests);
            }
            await CreateNotifications(notificationRequests);
        }

        public async Task SendMultiDayHearingConfirmationEmail(HearingDetailsResponse hearing, int days)
        {
            if (hearing.IsGenericHearing())
            {
                await ProcessGenericEmail(hearing, null);
                return;
            }

            List<AddNotificationRequest> requests;
            if (_featureToggles.BookAndConfirmToggle())
            {
                //The toggle switched on removes the where userRole != Judge LINQ clause
                requests = hearing.Participants
                    .Where(x => !x.UserRoleName.Contains(RoleNames.StaffMember, StringComparison.CurrentCultureIgnoreCase))
                    .Select(participant =>
                        AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(hearing, participant,
                            days))
                    .ToList();
            }
            else
            {
                //previous implementation to switch back to
                requests = hearing.Participants
                    .Where(x => !x.UserRoleName.Contains(RoleNames.StaffMember, StringComparison.CurrentCultureIgnoreCase))
                    .Where(x => !x.UserRoleName.Contains(RoleNames.Judge, StringComparison.CurrentCultureIgnoreCase))
                    .Select(participant =>
                        AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(hearing, participant,
                            days))
                    .ToList();
            }

            if (hearing.TelephoneParticipants != null)
            {
                var telephoneRequests = hearing.TelephoneParticipants
                .Where(x => !x.HearingRoleName.Contains(RoleNames.Judge, StringComparison.CurrentCultureIgnoreCase))
                .Select(participant =>
                    AddNotificationRequestMapper.MapToTelephoneHearingConfirmationNotificationMultiDay(hearing, participant, days))
                .ToList();

                requests.AddRange(telephoneRequests);
            }

            await CreateNotifications(requests);
        }

        public async Task ProcessGenericEmail(HearingDetailsResponse hearing, List<ParticipantResponse> participants)
        {
            if (string.Equals(hearing.HearingTypeName, "Automated Test", StringComparison.CurrentCultureIgnoreCase))
            {
                return;
            }

            var @case = hearing.Cases.First();

            var participantsToEmail = participants ?? hearing.Participants;

            var filteredParticipants = participantsToEmail;

            if (hearing.Status != BookingsApi.Contract.Enums.BookingStatus.Created)
            {
                filteredParticipants = filteredParticipants 
                    .Where(x => !x.UserRoleName.Contains(RoleNames.Judge, StringComparison.CurrentCultureIgnoreCase))
                    .Where(x => !x.UserRoleName.Contains(RoleNames.StaffMember, StringComparison.CurrentCultureIgnoreCase))
                    .ToList();
            }

            var notificationRequests = filteredParticipants
                .Select(participant => 
                    AddNotificationRequestMapper.MapToDemoOrTestNotification(hearing, participant, @case.Number, hearing.HearingTypeName)).Where(x => x != null)
                .ToList();

            if (notificationRequests.Count < 1) return;
            await CreateNotifications(notificationRequests);
        }

        public async Task SendHearingReminderEmail(HearingDetailsResponse hearing)
        {
            if (hearing.IsGenericHearing())
            {
                await ProcessGenericEmail(hearing, null);
                return;
            }

            if (hearing.DoesJudgeEmailExist())
            {
                await SendJudgeConfirmationEmail(hearing);
            }

            var requests = hearing.Participants
                .Where(x => !x.UserRoleName.Contains(RoleNames.Judge, StringComparison.CurrentCultureIgnoreCase))
                .Where(x => !x.UserRoleName.Contains(RoleNames.StaffMember, StringComparison.CurrentCultureIgnoreCase))
                .Select(participant =>
                    AddNotificationRequestMapper.MapToHearingReminderNotification(hearing, participant))
                .ToList();

            var hearings = await _bookingsApiClient.GetHearingsByGroupIdAsync(hearing.GroupId.Value);
            if (hearings.Count == 1)
            {
                requests.AddRange(hearing.Participants.Where(x => x.UserRoleName.Contains(RoleNames.StaffMember, StringComparison.CurrentCultureIgnoreCase)).Select(participant => AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, participant)).ToList());
            }
            else
            {
                requests.AddRange(hearing.Participants.Where(x => x.UserRoleName.Contains(RoleNames.StaffMember, StringComparison.CurrentCultureIgnoreCase)).Select(participant => AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(hearing, participant, hearings.Count)).ToList());
            }
            await CreateNotifications(requests);
        }

        public async Task SendJudgeConfirmationEmail(HearingDetailsResponse hearing)
        {
            var hearings = await _bookingsApiClient.GetHearingsByGroupIdAsync(hearing.GroupId.Value);
            AddNotificationRequest request;

            if (hearings.Count == 1)
            {
                var judge = hearing.Participants
                    .First(x => x.UserRoleName.Contains(RoleNames.Judge, StringComparison.CurrentCultureIgnoreCase));
                request = AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, judge);
            }
            else
            {
                var firstHearingForGroup = hearings.First();
                if (firstHearingForGroup.Id != hearing.Id)
                {
                    return;
                }

                var judge = firstHearingForGroup.Participants.First(x =>
                    x.UserRoleName.Contains("Judge", StringComparison.CurrentCultureIgnoreCase));
                request = AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(
                    firstHearingForGroup, judge, hearings.Count);
            }

            if (request.ContactEmail != null)
            {
                await _notificationApiClient.CreateNewNotificationAsync(request);
            }
        }

        public async Task<TeleConferenceDetails> GetTelephoneConferenceDetails(Guid hearingId)
        {
            var conferenceDetailsResponse = await _conferenceDetailsService.GetConferenceDetailsByHearingId(hearingId);
            if (conferenceDetailsResponse.HasValidMeetingRoom())
                return new TeleConferenceDetails(_kinlyConfiguration.ConferencePhoneNumber,
                    conferenceDetailsResponse.MeetingRoom.TelephoneConferenceId);

            throw new InvalidOperationException($"Couldn't get tele conference details as meeting room for a for a conference with the id {conferenceDetailsResponse.Id} was not valid");
        }

        public async Task ProcessParticipants(Guid hearingId, List<UpdateParticipantRequest> existingParticipants, List<ParticipantRequest> newParticipants,
            List<Guid> removedParticipantIds, List<LinkedParticipantRequest> linkedParticipants)
        {
            var updateHearingParticipantsRequest = new UpdateHearingParticipantsRequest
            {
                ExistingParticipants = existingParticipants,
                NewParticipants = newParticipants,
                RemovedParticipantIds = removedParticipantIds,
                LinkedParticipants = linkedParticipants
            };

            await _bookingsApiClient.UpdateHearingParticipantsAsync(hearingId, updateHearingParticipantsRequest);
        }

        public async Task<ParticipantRequest> ProcessNewParticipant(Guid hearingId, EditParticipantRequest participant,
            List<Guid> removedParticipantIds,
            HearingDetailsResponse hearing,
            Dictionary<string, User> usernameAdIdDict)
        {
            // Add a new participant
            // Map the request except the username
            var newParticipant = NewParticipantRequestMapper.MapTo(participant);
            // Judge and panel member is manually created in AD, no need to create one
            var ejudFeatureFlag = await _bookingsApiClient.GetFeatureFlagAsync(nameof(FeatureFlags.EJudFeature));

            if ((ejudFeatureFlag && (participant.CaseRoleName == RoleNames.Judge
                || participant.HearingRoleName == RoleNames.PanelMember
                || participant.HearingRoleName == RoleNames.Winger)) 
                || (!ejudFeatureFlag && participant.CaseRoleName == RoleNames.Judge))
            {
                if (hearing.Participants != null &&
                    hearing.Participants.Any(p => p.Username.Equals(participant.ContactEmail) && removedParticipantIds.All(removedParticipantId => removedParticipantId != p.Id)))
                {
                    //If the judge already exists in the database, there is no need to add again.
                    return null;
                }

                newParticipant.Username = participant.ContactEmail;
            }
            else
            {
                // Update the request with newly created user details in AD
                var user = await _userAccountService.UpdateParticipantUsername(newParticipant);
                newParticipant.Username = user.UserName;
                usernameAdIdDict.Add(newParticipant.Username, user);
            }

            _logger.LogDebug("Adding participant {Participant} to hearing {Hearing}",
                newParticipant.DisplayName, hearingId);
            return newParticipant;
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
                    .Find(p => p.ContactEmail.Equals(endpoint.DefenceAdvocateUsername,
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

        private async Task RemoveEndpointsFromHearing(HearingDetailsResponse hearing,
            IEnumerable<EndpointResponse> listOfEndpointsToDelete)
        {
            foreach (var endpointToDelete in listOfEndpointsToDelete)
            {
                _logger.LogDebug("Removing endpoint {Endpoint} - {EndpointDisplayName} from hearing {Hearing}",
                    endpointToDelete.Id, endpointToDelete.DisplayName, hearing.Id);
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
                DisplayName = endpoint.DisplayName,
                DefenceAdvocateUsername = endpoint.DefenceAdvocateUsername
            };
            await _bookingsApiClient.AddEndPointToHearingAsync(hearing.Id, addEndpointRequest);
        }

        private async Task UpdateEndpointInHearing(Guid hearingId, HearingDetailsResponse hearing,
            EditEndpointRequest endpoint)
        {
            var existingEndpointToEdit = hearing.Endpoints.FirstOrDefault(e => e.Id.Equals(endpoint.Id));
            if (existingEndpointToEdit == null ||
                existingEndpointToEdit.DisplayName == endpoint.DisplayName &&
                existingEndpointToEdit.DefenceAdvocateId.ToString() == endpoint.DefenceAdvocateUsername)
                return;

            _logger.LogDebug("Updating endpoint {Endpoint} - {EndpointDisplayName} in hearing {Hearing}",
                existingEndpointToEdit.Id, existingEndpointToEdit.DisplayName, hearingId);
            var updateEndpointRequest = new UpdateEndpointRequest
            {
                DisplayName = endpoint.DisplayName,
                DefenceAdvocateUsername = endpoint.DefenceAdvocateUsername
            };
            await _bookingsApiClient.UpdateDisplayNameForEndpointAsync(hearing.Id, endpoint.Id.Value,
                updateEndpointRequest);
        }

        public async Task UpdateParticipantLinks(Guid hearingId, EditHearingRequest request,
            HearingDetailsResponse hearing)
        {
            var existingParticipantWithLinks =
                request.Participants.Where(x => x.LinkedParticipants.Any() && x.Id.HasValue);
            foreach (var participantRequest in existingParticipantWithLinks)
            {
                await UpdateLinksForExistingParticipant(request, hearing, participantRequest);
            }
        }

        private async Task UpdateLinksForExistingParticipant(EditHearingRequest request, HearingDetailsResponse hearing,
            EditParticipantRequest requestParticipant)
        {
            var participant = hearing.Participants.First(x => x.Id == requestParticipant.Id);
            var linkedParticipantsInRequest = request.Participants.First(x => x.Id == participant.Id)
                .LinkedParticipants.ToList();

            var requests =
                BuildLinkedParticipantRequestForExistingParticipant(hearing, participant, linkedParticipantsInRequest);

            var updateParticipantRequest = new UpdateParticipantRequest
            {
                LinkedParticipants = requests,
                DisplayName = requestParticipant.DisplayName,
                OrganisationName = requestParticipant.OrganisationName,
                Representee = requestParticipant.Representee,
                TelephoneNumber = requestParticipant.TelephoneNumber,
                Title = requestParticipant.Title
            };

            await _bookingsApiClient.UpdateParticipantDetailsAsync(hearing.Id, participant.Id,
                updateParticipantRequest);
        }

        private List<LinkedParticipantRequest> BuildLinkedParticipantRequestForExistingParticipant(
            HearingDetailsResponse hearing, ParticipantResponse participant,
            IList<LinkedParticipant> linkedParticipantsInRequest)
        {
            var requests = new List<LinkedParticipantRequest>();

            var newLinks = GetNewLinkedParticipants(linkedParticipantsInRequest);

            requests.AddRange(newLinks);

            var existingLinks = GetExistingLinkedParticipants(linkedParticipantsInRequest, hearing, participant);

            requests.AddRange(existingLinks);

            return requests;
        }

        private static IEnumerable<LinkedParticipantRequest> GetNewLinkedParticipants(
            IEnumerable<LinkedParticipant> linkedParticipantsInRequest)
        {
            return linkedParticipantsInRequest.Where(x => x.LinkedId == Guid.Empty)
                .Select(lp => new LinkedParticipantRequest
                {
                    ParticipantContactEmail = lp.ParticipantContactEmail,
                    LinkedParticipantContactEmail = lp.LinkedParticipantContactEmail
                }).ToList();
        }

        private static IEnumerable<LinkedParticipantRequest> GetExistingLinkedParticipants(
            IEnumerable<LinkedParticipant> linkedParticipantsInRequest, HearingDetailsResponse hearing,
            ParticipantResponse participant)
        {
            var existingLinksToUpdate = linkedParticipantsInRequest.Where(x =>
                    x.LinkedId != Guid.Empty && !HasExistingLink(x, participant) && LinkedParticipantExists(hearing, x))
                .ToList();

            var existingLinks = existingLinksToUpdate.Select(linkedParticipantInRequest =>
                hearing.Participants.Find(x => x.Id == linkedParticipantInRequest.LinkedId)).ToList();

            if (!existingLinks.Any()) return new List<LinkedParticipantRequest>();

            return existingLinks.Select(linkedParticipant => new LinkedParticipantRequest
            {
                ParticipantContactEmail = participant.ContactEmail,
                LinkedParticipantContactEmail = linkedParticipant.ContactEmail
            }).ToList();
        }

        private static bool LinkedParticipantExists(HearingDetailsResponse hearing, LinkedParticipant linkedParticipant)
        {
            return hearing.Participants.Any(participant => participant.Id == linkedParticipant.LinkedId);
        }

        private static bool HasExistingLink(LinkedParticipant linkedParticipantInRequest,
            ParticipantResponse participant)
        {
            var linkedId = linkedParticipantInRequest.LinkedId;
            var existingLink = false;

            if (participant.LinkedParticipants != null)
            {
                existingLink = participant.LinkedParticipants.Exists(x => x.LinkedId == linkedId);
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

        private async Task AssignParticipantToGroupWithRetry(string username, string userId, string userRoleName,
            Guid hearingId)
        {
            await _pollyRetryService.WaitAndRetryAsync<Exception, Task>
            (
                4, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                retryAttempt =>
                    _logger.LogDebug(
                        $"{nameof(AssignParticipantToCorrectGroups)} - Failed to add username: {username} userId {userId} to role: {userRoleName} on AAD for hearingId: {hearingId}. Retrying attempt {retryAttempt}"),
                result => result.IsFaulted,
                async () =>
                {
                    _logger.LogDebug(
                        $"{nameof(AssignParticipantToCorrectGroups)} - Adding username: {username} userId {userId} to role: {userRoleName} on AAD for hearingId: {hearingId}");
                    await _userAccountService.AssignParticipantToGroup(userId, userRoleName);
                    _logger.LogDebug(
                        $"{nameof(AssignParticipantToCorrectGroups)} - Added username: {username} userId {userId} to role: {userRoleName} on AAD for hearingId: {hearingId}");
                    return Task.CompletedTask;
                }
            );
        }

        public async Task AddParticipantLinks(Guid hearingId, EditHearingRequest request,
            HearingDetailsResponse hearing)
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
                            ParticipantContactEmail = lp.ParticipantContactEmail,
                            LinkedParticipantContactEmail = lp.LinkedParticipantContactEmail
                        });
                    }

                    var updateParticipantRequest = new UpdateParticipantRequest
                    {
                        LinkedParticipants = requests,
                        DisplayName = requestParticipant.DisplayName,
                        OrganisationName = requestParticipant.OrganisationName,
                        Representee = requestParticipant.Representee,
                        TelephoneNumber = requestParticipant.TelephoneNumber,
                        Title = requestParticipant.Title
                    };
                    var newParticipant =
                        hearing.Participants.First(p => p.ContactEmail == requestParticipant.ContactEmail);
                    await _bookingsApiClient.UpdateParticipantDetailsAsync(hearingId, newParticipant.Id,
                        updateParticipantRequest);
                }
            }
        }

        private async Task CreateNotifications(List<AddNotificationRequest> notificationRequests)
        {
            if(_featureToggles.BookAndConfirmToggle())
                notificationRequests = notificationRequests.Where(req => !string.IsNullOrWhiteSpace(req.ContactEmail)).ToList();
            
            await Task.WhenAll(notificationRequests.Select(_notificationApiClient.CreateNewNotificationAsync));
        }
    }
}