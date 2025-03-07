using AdminWebsite.Contracts.Enums;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Client;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.Interfaces.Requests;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.Services
{
    public interface IHearingsService
    {
        void AssignEndpointDefenceAdvocates(List<Contracts.Requests.EndpointRequest> endpointsWithDa, IReadOnlyCollection<Contracts.Requests.ParticipantRequest> participants);
        Task ProcessParticipantsV2(Guid hearingId, List<UpdateParticipantRequestV2> existingParticipants, List<ParticipantRequestV2> newParticipants, List<Guid> removedParticipantIds, List<LinkedParticipantRequestV2> linkedParticipants);
        Task ProcessEndpoints(Guid hearingId, List<EditEndpointRequest> endpoints, HearingDetailsResponse hearing, List<IParticipantRequest> newParticipantList);
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
            await _bookingsApiClient.UpdateHearingParticipantsV2Async(hearingId, updateHearingParticipantsRequest);
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
                    await UpdateEndpointInHearing(hearingId, hearing, endpoint, newParticipantList);
                else
                    await AddEndpointToHearing(hearingId, hearing, endpoint);
            }
        }

        public static void UpdateEndpointWithNewlyAddedParticipant(List<IParticipantRequest> newParticipantList, EditEndpointRequest endpoint)
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
            var addEndpointRequest = new EndpointRequestV2()
            {
                DisplayName = endpoint.DisplayName,
                DefenceAdvocateContactEmail = endpoint.DefenceAdvocateContactEmail,
                InterpreterLanguageCode = endpoint.InterpreterLanguageCode,
                Screening = endpoint.ScreeningRequirements.MapToV2(),
                ExternalParticipantId = endpoint.ExternalReferenceId
            };
            await _bookingsApiClient.AddEndPointToHearingV2Async(hearing.Id, addEndpointRequest);
        }

        private async Task UpdateEndpointInHearing(Guid hearingId, HearingDetailsResponse hearing, EditEndpointRequest endpoint,
            IEnumerable<IParticipantRequest> newParticipantList)
        {
            var request = UpdateEndpointRequestV2Mapper.Map(hearing, endpoint, newParticipantList);
            if (request == null) return;
            
            _logger.LogDebug("Updating endpoint {Endpoint} - {EndpointDisplayName} in hearing {Hearing}",
                endpoint.Id, endpoint.DisplayName, hearingId);
            
            await _bookingsApiClient.UpdateEndpointV2Async(hearing.Id, endpoint.Id!.Value, request);
        }
    }
}