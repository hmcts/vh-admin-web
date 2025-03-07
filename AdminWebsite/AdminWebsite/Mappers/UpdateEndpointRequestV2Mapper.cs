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
        EditEndpointRequest endpoint,
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

    private static bool HasScreeningRequirementForEndpointChanged(
        EditEndpointRequest endpoint,
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
}