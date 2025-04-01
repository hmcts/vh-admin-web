using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Models;
using BookingsApi.Contract.Interfaces.Requests;
using BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.Mappers;

public static class UpdateEndpointRequestV2Mapper
{
    public static UpdateEndpointRequestV2 Map(
        HearingDetailsResponse hearing, 
        EditEndpointRequest editEndpointRequest,
        IEnumerable<IParticipantRequest> newParticipantList)
    {
        var existingEndpointToEdit = hearing.Endpoints.Find(e => e.Id.Equals(editEndpointRequest.Id));
        
        var participants = hearing.Participants
            .Select(ep => new EndpointParticipant { Id = ep.Id, ContactEmail = ep.ContactEmail })
            .Concat(newParticipantList.Select(np => new EndpointParticipant { Id = null, ContactEmail = np.ContactEmail }))
            .DistinctBy(da => da.ContactEmail) 
            .ToList();
        
        var endpointRequestParticipants = participants
            .Where(e => editEndpointRequest.LinkedParticipantEmails.Contains(e.ContactEmail, StringComparer.CurrentCultureIgnoreCase))
            .ToList();

        var newParticipantsAdded = endpointRequestParticipants.Exists(erp => erp.Id == null);

        var screeningChanged = HasScreeningRequirementForEndpointChanged(editEndpointRequest, existingEndpointToEdit);

        if (EndpointStateUnchanged(existingEndpointToEdit, editEndpointRequest, endpointRequestParticipants) && !screeningChanged && !newParticipantsAdded)
            return null;

        var updateEndpointRequest = new UpdateEndpointRequestV2
        {
            Id = editEndpointRequest.Id.GetValueOrDefault(),
            DisplayName = editEndpointRequest.DisplayName,
            LinkedParticipantEmails = editEndpointRequest.LinkedParticipantEmails,
            InterpreterLanguageCode = editEndpointRequest.InterpreterLanguageCode,
            Screening = editEndpointRequest.ScreeningRequirements?.MapToV2(),
            ExternalParticipantId = editEndpointRequest.ExternalReferenceId
        };

        return updateEndpointRequest;
    }
    
    private static bool EndpointStateUnchanged(EndpointResponse existing, EditEndpointRequest updated, List<EndpointParticipant> endpointRequestParticipants)
    {
        if (updated == null) 
            return false;

        return existing.DisplayName == updated.DisplayName &&
               existing.ExternalReferenceId == updated.ExternalReferenceId &&
               (existing.LinkedParticipantIds?.All(id => endpointRequestParticipants.Exists(e => e.Id == id)) ?? true);
    }


    private static bool HasScreeningRequirementForEndpointChanged(EditEndpointRequest endpoint, EndpointResponse existingEndpointToEdit)
    {
        var screeningRemoved = endpoint.ScreeningRequirements == null && existingEndpointToEdit.ScreeningRequirement != null;
        var screeningAdded = endpoint.ScreeningRequirements != null && existingEndpointToEdit.ScreeningRequirement == null;

        var existingScreenIds = existingEndpointToEdit.ScreeningRequirement?.ProtectFrom;
        var newScreenIds = endpoint.ScreeningRequirements?.ScreenFromExternalReferenceIds ?? new List<string>();
        var areListsIdentical = existingScreenIds?.OrderBy(id => id).SequenceEqual(newScreenIds.OrderBy(id => id)) ?? false;
        
        var screeningChanged = screeningRemoved || screeningAdded || !areListsIdentical;
        return screeningChanged;
    }
}