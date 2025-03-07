using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Models;
using BookingsApi.Contract.Interfaces.Requests;
using BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.Mappers;

public static class UpdateHearingParticipantsRequestV2Mapper
{
    public static UpdateHearingParticipantsRequestV2 Map(
        Guid hearingId,
        List<EditParticipantRequest> participants,
        HearingDetailsResponse originalHearing)
    {
        var existingParticipants = new List<UpdateParticipantRequestV2>();
        var newParticipants = new List<ParticipantRequestV2>();
        var removedParticipantIds = GetRemovedParticipantIds(participants, originalHearing);

        foreach (var participant in participants)
        {
            var newParticipantToAdd = NewParticipantRequestMapper.MapToV2(participant);
            if (participant.Id.HasValue)
                ExtractExistingParticipantsV2(originalHearing, participant, existingParticipants);
            else
                newParticipants.Add(newParticipantToAdd);
        }
            
        var linkedParticipants = ExtractLinkedParticipants(participants, originalHearing, removedParticipantIds, new List<IUpdateParticipantRequest>(existingParticipants), new List<IParticipantRequest>(newParticipants));
        var linkedParticipantsV2 = linkedParticipants.Select(lp => lp.MapToV2()).ToList();

        var updateHearingParticipantsRequest = new UpdateHearingParticipantsRequestV2
        {
            ExistingParticipants = existingParticipants,
            NewParticipants = newParticipants,
            RemovedParticipantIds = removedParticipantIds,
            LinkedParticipants = linkedParticipantsV2
        };

        return updateHearingParticipantsRequest;
    }
    
    private static List<Guid> GetRemovedParticipantIds(List<EditParticipantRequest> participants, HearingDetailsResponse originalHearing)
    {
        return GetRemovedParticipants(participants, originalHearing)
            .Select(x => x.Id).ToList();
    }

    private static List<ParticipantResponse> GetRemovedParticipants(List<EditParticipantRequest> participants, HearingDetailsResponse originalHearing)
    {
        return originalHearing.Participants.Where(p => participants.TrueForAll(rp => rp.Id != p.Id))
            .Select(x => x).ToList();
    }
    
    private static void ExtractExistingParticipantsV2(
        HearingDetailsResponse originalHearing,
        EditParticipantRequest participant, 
        List<UpdateParticipantRequestV2> existingParticipants)
    {
        var existingParticipant = originalHearing.Participants.Find(p => p.Id.Equals(participant.Id));
        if (existingParticipant == null || string.IsNullOrEmpty(existingParticipant.UserRoleName))
            return;
            
        var updateParticipantRequest = UpdateParticipantRequestMapper.MapToV2(participant);
        existingParticipants.Add(updateParticipantRequest);
    }
    
    private static List<LinkedParticipantRequest> ExtractLinkedParticipants(
        List<EditParticipantRequest> participants, 
        HearingDetailsResponse originalHearing,
        List<Guid> removedParticipantIds, 
        List<IUpdateParticipantRequest> existingParticipants, 
        List<IParticipantRequest> newParticipants)
    {
        var linkedParticipants = new List<LinkedParticipantRequest>();
        var participantsWithLinks = participants
            .Where(x => x.LinkedParticipants.Any() &&
                        !removedParticipantIds.Contains(x.LinkedParticipants[0].LinkedId) &&
                        !removedParticipantIds.Contains(x.LinkedParticipants[0].ParticipantId))
            .ToList();

        for (int i = 0; i < participantsWithLinks.Count; i++)
        {
            var participantWithLinks = participantsWithLinks[i];
            var linkedParticipantRequest = new LinkedParticipantRequest
            {
                LinkedParticipantContactEmail = participantWithLinks.LinkedParticipants[0].LinkedParticipantContactEmail,
                ParticipantContactEmail = participantWithLinks.LinkedParticipants[0].ParticipantContactEmail ?? participantWithLinks.ContactEmail,
                Type = participantWithLinks.LinkedParticipants[0].Type
            };

            // If the participant link is not new and already existed, then the ParticipantContactEmail will be null. We find it here and populate it.
            // We also remove the participant this one is linked to, to avoid duplicating entries.
            if (participantWithLinks.Id.HasValue &&
                existingParticipants.SingleOrDefault(x => x.ParticipantId == participantWithLinks.Id) != null)
            {
                // Is the linked participant an existing participant?
                var secondaryParticipantInLinkContactEmail = originalHearing.Participants
                    .SingleOrDefault(x => x.Id == participantWithLinks.LinkedParticipants[0].LinkedId)?
                    .ContactEmail ?? newParticipants
                    .SingleOrDefault(x =>
                        x.ContactEmail == participantWithLinks.LinkedParticipants[0].LinkedParticipantContactEmail)?
                    .ContactEmail;

                // If the linked participant isn't an existing participant it will be a newly added participant                        
                linkedParticipantRequest.LinkedParticipantContactEmail = secondaryParticipantInLinkContactEmail;

                // If the linked participant is an already existing user they will be mapped twice, so we remove them here.
                var secondaryParticipantInLinkIndex = participantsWithLinks
                    .FindIndex(x => x.ContactEmail == secondaryParticipantInLinkContactEmail);
                if (secondaryParticipantInLinkIndex >= 0)
                    participantsWithLinks.RemoveAt(secondaryParticipantInLinkIndex);
            }

            linkedParticipants.Add(linkedParticipantRequest);
        }
        return linkedParticipants;
    }
}