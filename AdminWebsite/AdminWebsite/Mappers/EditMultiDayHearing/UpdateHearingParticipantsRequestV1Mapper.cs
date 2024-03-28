using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Models.EditMultiDayHearing;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Responses;
using LinkedParticipantType = AdminWebsite.Contracts.Enums.LinkedParticipantType;
using LinkedParticipantRequest = AdminWebsite.Contracts.Requests.LinkedParticipantRequest;

namespace AdminWebsite.Mappers.EditMultiDayHearing
{
    public static class UpdateHearingParticipantsRequestV1Mapper
    {
        public static UpdateHearingParticipantsRequest MapParticipantsForFutureDayHearingV1(
            HearingDetailsResponse hearing,
            UpdateHearingParticipantsRequest participantsForEditedHearing,
            HearingChanges hearingChanges)
        {
            var participantsForThisHearing = hearing.Participants.ToList();

            var participantsRequest = new UpdateHearingParticipantsRequest
            {
                NewParticipants = participantsForEditedHearing.NewParticipants.ToList(),
                RemovedParticipantIds = MapRemovedParticipantIds(participantsForThisHearing, hearingChanges),
                ExistingParticipants = MapExistingParticipants(participantsForThisHearing, hearingChanges),
                LinkedParticipants = MapLinkedParticipants(participantsForThisHearing, hearingChanges)
            };

            return participantsRequest;
        }

        private static List<Guid> MapRemovedParticipantIds(
            List<ParticipantResponse> participantsForThisHearing,
            HearingChanges hearingChanges)
        {
            var removedParticipantIds = new List<Guid>();
            
            // Get the participants removed relative to the edited hearing, and re-map their ids for this hearing
            foreach (var removedParticipant in hearingChanges.RemovedParticipants)
            {
                var participantToRemoveForThisHearing = participantsForThisHearing.Find(x => x.ContactEmail == removedParticipant.ContactEmail);
                if (participantToRemoveForThisHearing != null)
                {
                    removedParticipantIds.Add(participantToRemoveForThisHearing.Id);
                }
            }

            return removedParticipantIds;
        }

        private static List<UpdateParticipantRequest> MapExistingParticipants(
            List<ParticipantResponse> participantsForThisHearing,
            HearingChanges hearingChanges)
        {
            var existingParticipants = new List<UpdateParticipantRequest>();
            
            // Get the existing participants relative to the edited hearing, and work out which edits were made to them in the request.
            // Apply only these edits to the existing participants for subsequent days in the hearing
            foreach (var existingParticipant in participantsForThisHearing)
            {
                var participantInRequest = hearingChanges.ParticipantChanges.Find(x => x.ParticipantRequest.ContactEmail == existingParticipant.ContactEmail);
                if (participantInRequest == null)
                {
                    continue;
                }
                
                var participantRequest = participantInRequest.ParticipantRequest;
                
                existingParticipants.Add(new UpdateParticipantRequest
                {
                    Title = participantInRequest.TitleChanged ? 
                        participantRequest.Title : existingParticipant.Title,
                    DisplayName = participantInRequest.DisplayNameChanged ? 
                        participantRequest.DisplayName : existingParticipant.DisplayName,
                    OrganisationName = participantInRequest.OrganisationNameChanged ? 
                        participantRequest.OrganisationName : existingParticipant.Organisation,
                    TelephoneNumber = participantInRequest.TelephoneChanged ? 
                        participantRequest.TelephoneNumber : existingParticipant.TelephoneNumber,
                    Representee = participantInRequest.RepresenteeChanged ? 
                        participantRequest.Representee : existingParticipant.Representee,
                    ParticipantId = existingParticipant.Id,
                    ContactEmail = existingParticipant.ContactEmail
                });
            }

            return existingParticipants;
        }

        private static List<BookingsApi.Contract.V1.Requests.LinkedParticipantRequest> MapLinkedParticipants(
            List<ParticipantResponse> participantsForThisHearing,
            HearingChanges hearingChanges)
        {
            // Linked participants
            
            // Put the existing linked participants for this hearing into the request

            var existingLinkedParticipants = new List<LinkedParticipantRequest>();
            var linkedParticipantsForThisHearing = participantsForThisHearing
                .SelectMany(x => x.LinkedParticipants)
                .ToList();

            foreach (var linkedParticipant in linkedParticipantsForThisHearing)
            {
                var linked = participantsForThisHearing.Find(x => x.Id == linkedParticipant.LinkedId);
                var participant = participantsForThisHearing
                    .First(x => x.LinkedParticipants.Exists(y => y.LinkedId == linkedParticipant.LinkedId));
                
                existingLinkedParticipants.Add(new LinkedParticipantRequest
                {
                    ParticipantContactEmail = participant.ContactEmail,
                    LinkedParticipantContactEmail = linked.ContactEmail,
                    Type = LinkedParticipantType.Interpreter
                });
            }

            var linkedParticipants = new List<LinkedParticipantRequest>();
            linkedParticipants.AddRange(existingLinkedParticipants);
            
            // Now get the new linked participants that have been added in the request.
            // For the ones that don't already exist on this hearing, add them to the request
            var newLinkedParticipants = new List<LinkedParticipantRequest>();
            var linkedParticipantsAddedInRequest = hearingChanges.LinkedParticipantChanges.NewLinkedParticipants.ToList();
            foreach (var newLinkedParticipantAddedInRequest in linkedParticipantsAddedInRequest)
            {
                newLinkedParticipants.Add(new LinkedParticipantRequest
                {
                    ParticipantContactEmail = newLinkedParticipantAddedInRequest.ParticipantContactEmail,
                    LinkedParticipantContactEmail = newLinkedParticipantAddedInRequest.LinkedParticipantContactEmail,
                    Type = LinkedParticipantType.Interpreter
                });
            }
            
            linkedParticipants.AddRange(newLinkedParticipants);

            // Remove any that we previously identified as having been removed
            var linkedParticipantsRemovedFromEditedHearing = hearingChanges.LinkedParticipantChanges.RemovedLinkedParticipants.ToList();
            foreach (var linkedParticipant in linkedParticipantsRemovedFromEditedHearing)
            {
                var linkedParticipantToRemove = linkedParticipants.Find(p => p.LinkedParticipantContactEmail == linkedParticipant.LinkedParticipantContactEmail);
                if (linkedParticipantToRemove != null)
                {
                    linkedParticipants.Remove(linkedParticipantToRemove);
                }
            }

            return linkedParticipants.Select(lp => lp.MapToV1()).ToList();
        }
    }
}
