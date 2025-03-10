using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers.EditMultiDayHearing;
using AdminWebsite.Models;
using AdminWebsite.Models.EditMultiDayHearing;
using AdminWebsite.Services;
using BookingsApi.Contract.Interfaces.Requests;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.Mappers;

public static class UpdateHearingsInGroupRequestMapper
{
    public static UpdateHearingsInGroupRequestV2 Map(
        List<HearingDetailsResponseV2> hearingsToUpdate,
        Guid originalEditedHearingId,
        EditMultiDayHearingRequest request,
        string updatedBy)
    {
        var bookingsApiRequest = new UpdateHearingsInGroupRequestV2
        {
            UpdatedBy = updatedBy
        };

        var participantsForEditedHearing = new UpdateHearingParticipantsRequestV2();
        var hearingChanges = new HearingChanges();
        
        foreach (var hearing in hearingsToUpdate)
        {
            var isFutureDay = hearing.Id != originalEditedHearingId;
            
            if (!isFutureDay)
            {
                hearingChanges = HearingChangesMapper.MapHearingChanges(hearing, request);
            }
            
            var hearingRequest = HearingRequestMapper.MapHearingRequestV2(hearing, hearingChanges, request);
            
            var hearingInGroup = request.HearingsInGroup.Find(h => h.HearingId == hearing.Id);
            hearingRequest.ScheduledDateTime = hearingInGroup.ScheduledDateTime;
        
            var hearingToUpdate = hearing.Map();
            
            var participants = request.Participants.ToList();
            var endpoints = request.Endpoints.ToList();
            var judiciaryParticipants = request.JudiciaryParticipants.ToList();

            if (isFutureDay)
            {
                ParticipantIdMapper.AssignParticipantIdsForFutureDayHearing(hearingToUpdate, participants, endpoints);

                hearingRequest.Participants = EditMultiDayHearing.UpdateHearingParticipantsRequestV2Mapper.MapParticipantsForFutureDayHearingV2(
                    hearing,
                    participantsForEditedHearing,
                    hearingChanges);

                var newParticipantList = new List<IParticipantRequest>(hearingRequest.Participants.NewParticipants);

                hearingRequest.Endpoints = MapUpdateHearingEndpointsRequestV2(endpoints, hearingToUpdate, newParticipantList, hearingChanges: hearingChanges);
                hearingRequest.JudiciaryParticipants = UpdateJudiciaryParticipantsRequestMapper.Map(judiciaryParticipants, hearingToUpdate, skipUnchangedParticipants: false, hearingChanges: hearingChanges);
            }
            else
            {
                hearingRequest.Participants = UpdateHearingParticipantsRequestV2Mapper.Map(hearingToUpdate.Id, participants, hearingToUpdate);
                
                var newParticipantList = new List<IParticipantRequest>(hearingRequest.Participants.NewParticipants);
                
                hearingRequest.Endpoints = MapUpdateHearingEndpointsRequestV2(endpoints, hearingToUpdate, newParticipantList, hearingChanges: hearingChanges);
                hearingRequest.JudiciaryParticipants = UpdateJudiciaryParticipantsRequestMapper.Map(judiciaryParticipants, hearingToUpdate, skipUnchangedParticipants: false);
                
                participantsForEditedHearing = hearingRequest.Participants;
            }
            
            bookingsApiRequest.Hearings.Add(hearingRequest);
        }

        return bookingsApiRequest;
    }

    private static UpdateHearingEndpointsRequestV2 MapUpdateHearingEndpointsRequestV2(
        List<EditEndpointRequest> endpoints, 
        HearingDetailsResponse hearing,
        List<IParticipantRequest> newParticipantList, 
        HearingChanges hearingChanges = null)
    {
        var endpointsV1 = MapUpdateHearingEndpointsRequest(endpoints, hearing, newParticipantList, hearingChanges: hearingChanges);
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
    
    private static UpdateHearingEndpointsRequestV2 MapUpdateHearingEndpointsRequest(
        List<EditEndpointRequest> endpoints, 
        HearingDetailsResponse hearing,
        List<IParticipantRequest> newParticipantList, 
        HearingChanges hearingChanges = null)
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
            HearingsService.UpdateEndpointWithNewlyAddedParticipant(newParticipantList, endpoint);

            if (endpoint.Id.HasValue)
            {
                var updateEndpointRequest = UpdateEndpointRequestV2Mapper.Map(hearing, endpoint, newParticipantList);
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