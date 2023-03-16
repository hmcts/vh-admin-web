using AdminWebsite.Contracts.Enums;
using AdminWebsite.Extensions;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Client;
using BookingsApi.Contract.Configuration;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
        void AssignEndpointDefenceAdvocates(List<EndpointRequest> endpointsWithDa, IReadOnlyCollection<ParticipantRequest> participants);
        Task ProcessParticipants(Guid hearingId, List<UpdateParticipantRequest> existingParticipants, List<ParticipantRequest> newParticipants, List<Guid> removedParticipantIds, List<LinkedParticipantRequest> linkedParticipants);
        Task<ParticipantRequest> ProcessNewParticipant(Guid hearingId, EditParticipantRequest participant, List<Guid> removedParticipantIds, HearingDetailsResponse hearing);
        Task ProcessEndpoints(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing, List<ParticipantRequest> newParticipantList);
        bool IsAddingParticipantOnly(EditHearingRequest editHearingRequest, HearingDetailsResponse hearingDetailsResponse);
        bool IsUpdatingJudge(EditHearingRequest editHearingRequest, HearingDetailsResponse hearingDetailsResponse);
        Task UpdateFailedBookingStatus(Guid hearingId);
    }

    public class HearingsService : IHearingsService
    {
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly ILogger<HearingsService> _logger;
#pragma warning disable S107
        public HearingsService(IBookingsApiClient bookingsApiClient, ILogger<HearingsService> logger)
        {
            _bookingsApiClient = bookingsApiClient;
            _logger = logger;
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

        public bool IsUpdatingJudge(EditHearingRequest editHearingRequest,
            HearingDetailsResponse hearingDetailsResponse)
        {
            var existingJudge = hearingDetailsResponse.Participants.FirstOrDefault(x => x.HearingRoleName == HearingRoleName.Judge);
            var newJudge = editHearingRequest.Participants.FirstOrDefault(x => x.HearingRoleName == HearingRoleName.Judge);
            return newJudge?.ContactEmail != existingJudge?.ContactEmail;
        }

        public bool HasEndpointsBeenChanged(List<EditEndpointRequest> originalEndpoints, List<EditEndpointRequest> requestEndpoints)
        {
            return originalEndpoints.Except(requestEndpoints, EditEndpointRequest.EditEndpointRequestComparer)
                .ToList()
                .Count == 0 && requestEndpoints
                .Except(originalEndpoints, EditEndpointRequest.EditEndpointRequestComparer)
                .ToList()
                .Count == 0;
        }
        
        public List<EditParticipantRequest> GetAddedParticipant(List<EditParticipantRequest> originalParticipants, List<EditParticipantRequest> requestParticipants)
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

        public async Task<ParticipantRequest> ProcessNewParticipant(
            Guid hearingId, 
            EditParticipantRequest participant,
            List<Guid> removedParticipantIds,
            HearingDetailsResponse hearing)
        {
            // Add a new participant
            // Map the request except the username
            var newParticipant = NewParticipantRequestMapper.MapTo(participant);
            var ejudFeatureFlag = await _bookingsApiClient.GetFeatureFlagAsync(nameof(FeatureFlags.EJudFeature));

            if ((ejudFeatureFlag && (participant.CaseRoleName == RoleNames.Judge
                || participant.HearingRoleName == RoleNames.PanelMember
                || participant.HearingRoleName == RoleNames.Winger))
                || (!ejudFeatureFlag && participant.CaseRoleName == RoleNames.Judge))
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
        public async Task UpdateFailedBookingStatus(Guid hearingId)
        {
            await _bookingsApiClient.UpdateBookingStatusAsync(hearingId,
                new UpdateBookingStatusRequest
                {
                    Status = BookingsApi.Contract.Requests.Enums.UpdateBookingStatus.Failed,
                    UpdatedBy = "System",
                    CancelReason = string.Empty
                });
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
    }
}