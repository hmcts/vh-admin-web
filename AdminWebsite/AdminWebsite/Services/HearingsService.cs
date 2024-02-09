using AdminWebsite.Contracts.Enums;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Client;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.Interfaces.Requests;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.Services
{
    public interface IHearingsService
    {
        void AssignEndpointDefenceAdvocates(List<Contracts.Requests.EndpointRequest> endpointsWithDa, IReadOnlyCollection<Contracts.Requests.ParticipantRequest> participants);
        Task ProcessParticipants(Guid hearingId, List<UpdateParticipantRequest> existingParticipants, List<ParticipantRequest> newParticipants, List<Guid> removedParticipantIds, List<LinkedParticipantRequest> linkedParticipants);
        Task ProcessParticipantsV2(Guid hearingId, List<UpdateParticipantRequestV2> existingParticipants, List<ParticipantRequestV2> newParticipants, List<Guid> removedParticipantIds, List<LinkedParticipantRequestV2> linkedParticipants);
        Task<ParticipantRequest> ProcessNewParticipant(Guid hearingId, EditParticipantRequest participant, List<Guid> removedParticipantIds, HearingDetailsResponse hearing);
        Task<IParticipantRequest> ProcessNewParticipant(Guid hearingId, EditParticipantRequest participant, IParticipantRequest newParticipant, List<Guid> removedParticipantIds, HearingDetailsResponse hearing);
        Task ProcessEndpoints(Guid hearingId, List<EditEndpointRequest> endpoints, HearingDetailsResponse hearing, List<IParticipantRequest> newParticipantList);
    }

    public class HearingsService : IHearingsService
    {
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly IFeatureToggles _featureToggles;
        private readonly ILogger<HearingsService> _logger;
#pragma warning disable S107
        public HearingsService(IBookingsApiClient bookingsApiClient, ILogger<HearingsService> logger, IFeatureToggles featureToggles)
        {
            _bookingsApiClient = bookingsApiClient;
            _logger = logger;
            _featureToggles = featureToggles;
        }

        public void AssignEndpointDefenceAdvocates(List<Contracts.Requests.EndpointRequest> endpointsWithDa, IReadOnlyCollection<Contracts.Requests.ParticipantRequest> participants)
        {
            // update the username of defence advocate 
            foreach (var endpoint in endpointsWithDa)
            {
                _logger.LogDebug("Attempting to find defence advocate {DefenceAdvocate} for endpoint {Endpoint}",
                    endpoint.DefenceAdvocateContactEmail, endpoint.DisplayName);
                var defenceAdvocate = participants.Single(x => 
                    x.ContactEmail.Equals(endpoint.DefenceAdvocateContactEmail,StringComparison.CurrentCultureIgnoreCase));
                endpoint.DefenceAdvocateContactEmail = defenceAdvocate.ContactEmail;
            }
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

        public async Task ProcessParticipants(Guid hearingId, 
            List<UpdateParticipantRequest> existingParticipants, 
            List<ParticipantRequest> newParticipants,
            List<Guid> removedParticipantIds, 
            List<LinkedParticipantRequest> linkedParticipants)
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
        
        public async Task ProcessParticipantsV2(Guid hearingId, 
            List<UpdateParticipantRequestV2> existingParticipants, 
            List<ParticipantRequestV2> newParticipants,
            List<Guid> removedParticipantIds, 
            List<LinkedParticipantRequestV2> linkedParticipants)
        {

            var updateHearingParticipantsRequest = new UpdateHearingParticipantsRequestV2
            {
                ExistingParticipants = existingParticipants,
                NewParticipants = newParticipants,
                RemovedParticipantIds = removedParticipantIds,
                LinkedParticipants = linkedParticipants
            };
            await _bookingsApiClient.UpdateHearingParticipants2Async(hearingId, updateHearingParticipantsRequest);
        }

        public async Task<ParticipantRequest> ProcessNewParticipant(
            Guid hearingId, 
            EditParticipantRequest participant,
            List<Guid> removedParticipantIds,
            HearingDetailsResponse hearing)
        {
            var newParticipant = NewParticipantRequestMapper.MapTo(participant);
            return (ParticipantRequest)await ProcessNewParticipant(hearingId, participant, newParticipant, removedParticipantIds, hearing);
        }
    
        public Task<IParticipantRequest> ProcessNewParticipant(
            Guid hearingId,
            EditParticipantRequest participant,
            IParticipantRequest newParticipant,
            List<Guid> removedParticipantIds,
            HearingDetailsResponse hearing)
        {
            // Add a new participant
            // Map the request except the username
            var ejudFeatureFlag = _featureToggles.EJudEnabled();

            if ((ejudFeatureFlag && (participant.CaseRoleName == RoleNames.Judge 
                || participant.HearingRoleName == RoleNames.PanelMember
                || participant.HearingRoleName == RoleNames.Winger))
                || (!ejudFeatureFlag && participant.CaseRoleName == RoleNames.Judge))
            {
                if (hearing.Participants != null &&
                    hearing.Participants.Exists(p => p.ContactEmail.Equals(participant.ContactEmail) && removedParticipantIds.TrueForAll(removedParticipantId => removedParticipantId != p.Id)))
                {
                    //If the judge already exists in the database, there is no need to add again.
                    return Task.FromResult<IParticipantRequest>(null);
                }

                if (newParticipant is ParticipantRequest v1Request)
                {
                    v1Request.Username = participant.ContactEmail;
                }
            }

            _logger.LogDebug("Adding participant {Participant} to hearing {Hearing}",
                newParticipant.DisplayName, hearingId);
            return Task.FromResult(newParticipant);
        }

        public async Task ProcessEndpoints(Guid hearingId, List<EditEndpointRequest> endpoints, HearingDetailsResponse hearing,
            List<IParticipantRequest> newParticipantList)
        {
            if (hearing.Endpoints == null) return;

            var listOfEndpointsToDelete = hearing.Endpoints.Where(e => endpoints.TrueForAll(re => re.Id != e.Id));
            await RemoveEndpointsFromHearing(hearing, listOfEndpointsToDelete);
            
            foreach (var endpoint in endpoints)
            {
                UpdateEndpointWithNewlyAddedParticipant(newParticipantList, endpoint);

                if (endpoint.Id.HasValue)
                    await UpdateEndpointInHearing(hearingId, hearing, endpoint);
                else
                    await AddEndpointToHearing(hearingId, hearing, endpoint);
            }
        }

        private static void UpdateEndpointWithNewlyAddedParticipant(List<IParticipantRequest> newParticipantList, EditEndpointRequest endpoint)
        {
            var epToUpdate = newParticipantList
                .Find(p => p.ContactEmail.Equals(endpoint.DefenceAdvocateContactEmail,
                    StringComparison.CurrentCultureIgnoreCase));
            if (epToUpdate != null)
                endpoint.DefenceAdvocateContactEmail = epToUpdate.ContactEmail;
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

        private async Task UpdateEndpointInHearing(Guid hearingId, HearingDetailsResponse hearing, EditEndpointRequest endpoint)
        {
            var existingEndpointToEdit = hearing.Endpoints.Find(e => e.Id.Equals(endpoint.Id));
            var endpointRequestDefenceAdvocate = hearing.Participants.Find(e => e.ContactEmail == endpoint.DefenceAdvocateContactEmail);
            if (existingEndpointToEdit == null ||
                existingEndpointToEdit.DisplayName == endpoint.DisplayName &&
                existingEndpointToEdit.DefenceAdvocateId == endpointRequestDefenceAdvocate?.Id)
                return;

            _logger.LogDebug("Updating endpoint {Endpoint} - {EndpointDisplayName} in hearing {Hearing}",
                existingEndpointToEdit.Id, existingEndpointToEdit.DisplayName, hearingId);
            var updateEndpointRequest = new UpdateEndpointRequest
            {
                DisplayName = endpoint.DisplayName,
                DefenceAdvocateContactEmail = endpoint.DefenceAdvocateContactEmail
            };
            await _bookingsApiClient.UpdateDisplayNameForEndpointAsync(hearing.Id, endpoint.Id.Value, updateEndpointRequest);
        }
    }
}