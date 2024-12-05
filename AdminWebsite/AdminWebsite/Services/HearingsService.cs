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
using AdminWebsite.Models.EditMultiDayHearing;
using BookingsApi.Contract.Interfaces.Requests;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.Services
{
    public interface IHearingsService
    {
        void AssignEndpointDefenceAdvocates(List<Contracts.Requests.EndpointRequest> endpointsWithDa, IReadOnlyCollection<Contracts.Requests.ParticipantRequest> participants);
        Task ProcessParticipantsV2(Guid hearingId, List<UpdateParticipantRequestV2> existingParticipants, List<ParticipantRequestV2> newParticipants, List<Guid> removedParticipantIds, List<LinkedParticipantRequestV2> linkedParticipants);
        Task<IParticipantRequest> ProcessNewParticipant(Guid hearingId, EditParticipantRequest participant, IParticipantRequest newParticipant, List<Guid> removedParticipantIds, HearingDetailsResponse hearing);
        Task ProcessEndpoints(Guid hearingId, List<EditEndpointRequest> endpoints, HearingDetailsResponse hearing, List<IParticipantRequest> newParticipantList);
        UpdateHearingEndpointsRequestV2 MapUpdateHearingEndpointsRequestV2(Guid hearingId, List<EditEndpointRequest> endpoints, HearingDetailsResponse hearing, List<IParticipantRequest> newParticipantList, HearingChanges hearingChanges = null);
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
        
        public static List<EditParticipantRequest> GetAddedParticipant(List<EditParticipantRequest> originalParticipants, List<EditParticipantRequest> requestParticipants)
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
        
        public Task<IParticipantRequest> ProcessNewParticipant(
            Guid hearingId,
            EditParticipantRequest participant,
            IParticipantRequest newParticipant,
            List<Guid> removedParticipantIds,
            HearingDetailsResponse hearing)
        {
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
                    await UpdateEndpointInHearing(hearingId, hearing, endpoint, newParticipantList);
                else
                    await AddEndpointToHearing(hearingId, hearing, endpoint);
            }
        }

        public UpdateHearingEndpointsRequestV2 MapUpdateHearingEndpointsRequestV2(Guid hearingId, List<EditEndpointRequest> endpoints, HearingDetailsResponse hearing,
            List<IParticipantRequest> newParticipantList, HearingChanges hearingChanges = null)
        {
            var endpointsV1 = MapUpdateHearingEndpointsRequest(hearingId, endpoints, hearing, newParticipantList, hearingChanges: hearingChanges);
            var endpointsV2 = new UpdateHearingEndpointsRequestV2
            {
                NewEndpoints = endpointsV1.NewEndpoints
                    .Select(v1 => new EndpointRequestV2
                    {
                        DisplayName = v1.DisplayName,
                        DefenceAdvocateContactEmail = v1.DefenceAdvocateContactEmail
                    })
                    .ToList(),
                ExistingEndpoints = endpointsV1.ExistingEndpoints
                    .Select(v1 => new UpdateEndpointRequestV2
                    {
                        Id = v1.Id,
                        DisplayName = v1.DisplayName,
                        DefenceAdvocateContactEmail = v1.DefenceAdvocateContactEmail
                    })
                    .ToList(),
                RemovedEndpointIds = endpointsV1.RemovedEndpointIds.ToList()
            };

            return endpointsV2;
        }
        
        private UpdateHearingEndpointsRequestV2 MapUpdateHearingEndpointsRequest(Guid hearingId, List<EditEndpointRequest> endpoints, HearingDetailsResponse hearing,
            List<IParticipantRequest> newParticipantList, HearingChanges hearingChanges = null)
        {
            if (hearing.Endpoints == null) return null;

            var request = new UpdateHearingEndpointsRequestV2();

            var listOfEndpointsToDelete =
                hearing.Endpoints.Where(e => endpoints.TrueForAll(re => re.Id != e.Id)).ToList();
            if (hearingChanges != null)
            {
                // Only remove endpoints that have been explicitly removed as part of this request, if they exist on this hearing
                listOfEndpointsToDelete = hearing.Endpoints.Where(e => hearingChanges.RemovedEndpoints.Exists(re => re.DisplayName == e.DisplayName)).ToList();
            }

            foreach (var endpointToDelete in listOfEndpointsToDelete)
            {
                request.RemovedEndpointIds.Add(endpointToDelete.Id);
            }

            var newOrExistingEndpoints = endpoints.ToList();
            
            if (hearingChanges != null)
            {
                newOrExistingEndpoints = MapNewOrExistingEndpointsFromHearingChanges(endpoints, hearing, hearingChanges, listOfEndpointsToDelete);
            }

            foreach (var endpoint in newOrExistingEndpoints)
            {
                UpdateEndpointWithNewlyAddedParticipant(newParticipantList, endpoint);

                if (endpoint.Id.HasValue)
                {
                    var updateEndpointRequest = MapToUpdateEndpointRequest(hearingId, hearing, endpoint, newParticipantList);
                    if (updateEndpointRequest != null)
                    {
                        request.ExistingEndpoints.Add(updateEndpointRequest);
                    }
                }
                else
                {
                    var addEndpointRequest = new EndpointRequestV2
                    {
                        DisplayName = endpoint.DisplayName,
                        DefenceAdvocateContactEmail = endpoint.DefenceAdvocateContactEmail,
                        InterpreterLanguageCode = endpoint.InterpreterLanguageCode,
                        Screening = endpoint.ScreeningRequirements?.MapToV2(),
                        ExternalParticipantId = endpoint.ExternalReferenceId
                    };
                
                    request.NewEndpoints.Add(addEndpointRequest);
                }
            }

            return request;
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
            var request = MapToUpdateEndpointRequest(hearingId, hearing, endpoint, newParticipantList);
            if (request == null) return;
            
            _logger.LogDebug("Updating endpoint {Endpoint} - {EndpointDisplayName} in hearing {Hearing}",
                endpoint.Id, endpoint.DisplayName, hearingId);
            
            await _bookingsApiClient.UpdateEndpointV2Async(hearing.Id, endpoint.Id!.Value, request);
        }

        private UpdateEndpointRequestV2 MapToUpdateEndpointRequest(Guid hearingId, HearingDetailsResponse hearing, EditEndpointRequest endpoint,
            IEnumerable<IParticipantRequest> newParticipantList)
        {
            var existingEndpointToEdit = hearing.Endpoints.Find(e => e.Id.Equals(endpoint.Id));
            var defenceAdvocates = DefenceAdvocateMapper.Map(hearing.Participants, newParticipantList);
            var endpointRequestDefenceAdvocate = defenceAdvocates.Find(e => e.ContactEmail == endpoint.DefenceAdvocateContactEmail);
            var isNewDefenceAdvocate = endpointRequestDefenceAdvocate?.Id == null;

            var screeningChanged = HasScreeningRequirementForEndpointChanged(endpoint, existingEndpointToEdit);

            if (existingEndpointToEdit == null ||
                existingEndpointToEdit.DisplayName == endpoint.DisplayName &&
                existingEndpointToEdit.DefenceAdvocateId == endpointRequestDefenceAdvocate?.Id &&
                existingEndpointToEdit.ExternalReferenceId == endpoint.ExternalReferenceId &&
                !screeningChanged && !isNewDefenceAdvocate)
                return null;

            _logger.LogDebug("Updating endpoint {Endpoint} - {EndpointDisplayName} in hearing {Hearing}",
                existingEndpointToEdit.Id, existingEndpointToEdit.DisplayName, hearingId);
            var updateEndpointRequest = new UpdateEndpointRequestV2()
            {
                Id = endpoint.Id.GetValueOrDefault(),
                DisplayName = endpoint.DisplayName,
                DefenceAdvocateContactEmail = endpoint.DefenceAdvocateContactEmail,
                InterpreterLanguageCode = endpoint.InterpreterLanguageCode,
                Screening = endpoint.ScreeningRequirements?.MapToV2(),
                ExternalParticipantId = endpoint.ExternalReferenceId
            };

            return updateEndpointRequest;
        }

        private static bool HasScreeningRequirementForEndpointChanged(EditEndpointRequest endpoint,
            EndpointResponse existingEndpointToEdit)
        {
            var screeningRemoved = endpoint.ScreeningRequirements == null &&
                                   existingEndpointToEdit.ScreeningRequirement != null;
            var screeningAdded = endpoint.ScreeningRequirements != null &&
                                 existingEndpointToEdit.ScreeningRequirement == null;

            var existingScreenIds = existingEndpointToEdit.ScreeningRequirement?.ProtectFrom;
            var newScreenIds = endpoint.ScreeningRequirements?.ScreenFromExternalReferenceIds ?? new List<string>();
            var areListsIdentical = existingScreenIds?.OrderBy(id => id).SequenceEqual(newScreenIds.OrderBy(id => id)) ?? false;
            
            var screeningChanged = screeningRemoved || screeningAdded || !areListsIdentical;
            return screeningChanged;
        }

        private static List<EditEndpointRequest> MapNewOrExistingEndpointsFromHearingChanges(
            IEnumerable<EditEndpointRequest> endpoints, 
            HearingDetailsResponse hearing, 
            HearingChanges hearingChanges, 
            IEnumerable<EndpointResponse> listOfEndpointsToDelete)
        {
            var newOrExistingEndpoints = new List<EditEndpointRequest>();
                
            var newEndpoints = endpoints
                .Where(e => !hearingChanges.EndpointChanges.Exists(ec => ec.EndpointRequest.DisplayName == e.DisplayName))
                .ToList();
                
            var existingEndpoints = hearing.Endpoints
                .ToList();
                
            // Add the existing endpoints on this hearing
            newOrExistingEndpoints.AddRange(existingEndpoints.Select(e => new EditEndpointRequest
            {
                Id = e.Id,
                DisplayName = e.DisplayName,
                DefenceAdvocateContactEmail = hearing.Participants.Find(x => x.Id == e.DefenceAdvocateId)?.ContactEmail
            }));
            
            // If any of these endpoints relate to the ones in the request, update their properties to match those in the request
            foreach (var endpoint in newOrExistingEndpoints)
            {
                var relatedEndpoint = hearingChanges.EndpointChanges.Find(x => x.OriginalDisplayName == endpoint.DisplayName);
                if (relatedEndpoint != null)
                {
                    endpoint.DisplayName = relatedEndpoint.EndpointRequest.DisplayName;
                    endpoint.DefenceAdvocateContactEmail = relatedEndpoint.EndpointRequest.DefenceAdvocateContactEmail;
                }
            }

            // Add any new endpoints that have been added as part of this request
            foreach (var newEndpoint in newEndpoints)
            {
                if (!newOrExistingEndpoints.Exists(e => e.DisplayName == newEndpoint.DisplayName))
                {
                    newOrExistingEndpoints.Add(newEndpoint);
                }
            }

            // Exclude any that have been removed as part of this request
            newOrExistingEndpoints = newOrExistingEndpoints
                .Where(e => listOfEndpointsToDelete.All(d => d.DisplayName != e.DisplayName))
                .ToList();

            return newOrExistingEndpoints;
        }
    }
}