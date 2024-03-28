using System;
using System.Collections.Generic;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Models;

namespace AdminWebsite.Mappers.EditMultiDayHearing
{
    public static class ParticipantIdMapper
    {
        public static void AssignParticipantIdsForFutureDayHearing(HearingDetailsResponse multiDayHearingFutureDay, 
            List<EditParticipantRequest> participants, 
            List<EditEndpointRequest> endpoints)
        {
            // For the future day hearings, the participant ids will be different
            // So we need to set their ids to null if they are new participants, or use their existing ids if they already exist
            // Need to also handle the scenarios where:
            // 1. Participant is new to the edited hearing, but already exists on the future day hearing
            // 2. Participant already exists on the edited hearing, but is new to the future day hearing

            var participantIdMappings = new Dictionary<Guid, Guid>();
            var participantsNewToEditedHearingButExistOnFutureDayHearing = new Dictionary<string, Guid>();
                   
            CreateParticipantMappings();
            
            // Update the participant ids
            foreach (var participant in participants)
            {
                MapParticipantId(participant);
                
                // // Update the linked participant ids
                // foreach (var linkedParticipant in participant.LinkedParticipants)
                // {
                //     linkedParticipant.LinkedId = participantIdMappings[linkedParticipant.LinkedId];
                // }
            }

            foreach (var endpoint in endpoints)
            {
                // Unlike participants we don't have a common identifier, so need to remove the existing endpoints and replace them
                endpoint.Id = null;
            }
   
            void CreateParticipantMappings()
            {
                // Create the participant mappings
                foreach (var participant in participants)
                {
                    var existingParticipant = multiDayHearingFutureDay.Participants.Find(x => x.ContactEmail == participant.ContactEmail);
                    if (existingParticipant == null)
                    {
                        continue;
                    }

                    if (participant.Id == null)
                    {
                        // This participant is new to the edited hearing, but exists on the future day hearing
                        participantsNewToEditedHearingButExistOnFutureDayHearing.Add(participant.ContactEmail, existingParticipant.Id);
                        continue;
                    }
                
                    participantIdMappings.Add(participant.Id.Value, existingParticipant.Id);
                }
            }

            void MapParticipantId(EditParticipantRequest participant)
            {
                if (participant.Id.HasValue)
                {
                    if (participantIdMappings.TryGetValue(participant.Id.Value, out var id))
                    {
                        participant.Id = id;
                    }
                    else
                    {
                        // Participant exists on the edited hearing, but is new to the future day hearing
                        participant.Id = null;
                    }
                }
                else
                {
                    // Check if the participant is new to the edited hearing, but exists on the future day hearing
                    if (participantsNewToEditedHearingButExistOnFutureDayHearing.TryGetValue(participant.ContactEmail, out var id))
                    {
                        participant.Id = id;
                    }
                    else
                    {
                        participant.Id = null;
                    }
                }
            }
        }
    }
}
