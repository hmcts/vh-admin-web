using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Extensions;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Client;
using BookingsApi.Contract.Configuration;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NotificationApi.Client;
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
        void AssignEndpointDefenceAdvocates(List<EndpointRequest> endpointsWithDa,
            IReadOnlyCollection<ParticipantRequest> participants);

        Task ProcessParticipants(Guid hearingId, List<UpdateParticipantRequest> existingParticipants, List<ParticipantRequest> newParticipants,
            List<Guid> removedParticipantIds, List<LinkedParticipantRequest> linkedParticipants);

        Task<ParticipantRequest> ProcessNewParticipant(Guid hearingId, EditParticipantRequest participant,
            List<Guid> removedParticipantIds, HearingDetailsResponse hearing);

        Task ProcessEndpoints(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing,
            List<ParticipantRequest> newParticipantList);

        bool IsAddingParticipantOnly(EditHearingRequest editHearingRequest,
            HearingDetailsResponse hearingDetailsResponse);
        bool IsAddingOrRemovingStaffMember(EditHearingRequest editHearingRequest,
            HearingDetailsResponse hearingDetailsResponse);

        bool IsUpdatingJudge(EditHearingRequest editHearingRequest, HearingDetailsResponse hearingDetailsResponse);

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

        public void AssignEndpointDefenceAdvocates(List<EndpointRequest> endpointsWithDa,
            IReadOnlyCollection<ParticipantRequest> participants)
        {
            // update the username of defence advocate 
            foreach (var endpoint in endpointsWithDa)
            {
                _logger.LogDebug("Attempting to find defence advocate {DefenceAdvocate} for endpoint {Endpoint}",
                    endpoint.DefenceAdvocateContactEmail, endpoint.DisplayName);
                var defenceAdvocate = participants.Single(x =>
                    x.ContactEmail.Equals(endpoint.DefenceAdvocateContactEmail,
                        StringComparison.CurrentCultureIgnoreCase));
                endpoint.DefenceAdvocateContactEmail = defenceAdvocate.ContactEmail;
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

        public bool IsUpdatingJudge(EditHearingRequest editHearingRequest,
            HearingDetailsResponse hearingDetailsResponse)
        {
            var existingJudge =
                hearingDetailsResponse.Participants.FirstOrDefault(
                    x => x.HearingRoleName == HearingRoleName.Judge);
            var newJudge =
                editHearingRequest.Participants.FirstOrDefault(x => x.HearingRoleName == HearingRoleName.Judge);
            var existingJudgeOtherInformation = HearingDetailsResponseExtensions.GetJudgeOtherInformationString(hearingDetailsResponse.OtherInformation);
            var newJudgeOtherInformation = HearingDetailsResponseExtensions.GetJudgeOtherInformationString(editHearingRequest.OtherInformation);

            return (newJudge?.ContactEmail != existingJudge?.ContactEmail) ||
                   (newJudgeOtherInformation ?? string.Empty) != (existingJudgeOtherInformation ?? string.Empty);
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
            HearingDetailsResponse hearing)
        {
            // Add a new participant
            // Map the request except the username
            var newParticipant = NewParticipantRequestMapper.MapTo(participant);

            if (participant.CaseRoleName == RoleNames.Judge)
            {
                if (hearing.Participants != null &&
                    hearing.Participants.Any(p => p.ContactEmail.Equals(participant.ContactEmail) && removedParticipantIds.All(removedParticipantId => removedParticipantId != p.Id)))
                {
                    //If the judge already exists in the database, there is no need to add again.
                    return null;
                }
                
                newParticipant.Username = participant.ContactEmail;
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
                    .Find(p => p.ContactEmail.Equals(endpoint.DefenceAdvocateContactEmail,
                        StringComparison.CurrentCultureIgnoreCase));
                if (epToUpdate != null)
                {
                    endpoint.DefenceAdvocateContactEmail = epToUpdate.ContactEmail;
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
                DefenceAdvocateContactEmail = endpoint.DefenceAdvocateContactEmail
            };
            await _bookingsApiClient.AddEndPointToHearingAsync(hearing.Id, addEndpointRequest);
        }

        private async Task UpdateEndpointInHearing(Guid hearingId, HearingDetailsResponse hearing,
            EditEndpointRequest endpoint)
        {
            var existingEndpointToEdit = hearing.Endpoints.FirstOrDefault(e => e.Id.Equals(endpoint.Id));
            if (existingEndpointToEdit == null ||
                existingEndpointToEdit.DisplayName == endpoint.DisplayName &&
                existingEndpointToEdit.DefenceAdvocateId.ToString() == endpoint.DefenceAdvocateContactEmail)
                return;

            _logger.LogDebug("Updating endpoint {Endpoint} - {EndpointDisplayName} in hearing {Hearing}",
                existingEndpointToEdit.Id, existingEndpointToEdit.DisplayName, hearingId);
            var updateEndpointRequest = new UpdateEndpointRequest
            {
                DisplayName = endpoint.DisplayName,
                DefenceAdvocateContactEmail = endpoint.DefenceAdvocateContactEmail
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
    }
}