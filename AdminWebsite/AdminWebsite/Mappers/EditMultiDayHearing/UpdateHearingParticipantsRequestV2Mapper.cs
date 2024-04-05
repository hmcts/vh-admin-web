using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Models.EditMultiDayHearing;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;
using LinkedParticipantType = AdminWebsite.Contracts.Enums.LinkedParticipantType;
using LinkedParticipantRequest = AdminWebsite.Contracts.Requests.LinkedParticipantRequest;

namespace AdminWebsite.Mappers.EditMultiDayHearing
{
    public static class UpdateHearingParticipantsRequestV2Mapper
    {
        public static UpdateHearingParticipantsRequestV2 MapParticipantsForFutureDayHearingV2(
            HearingDetailsResponseV2 hearing,
            UpdateHearingParticipantsRequestV2 participantsForEditedHearing,
            HearingChanges hearingChanges)
        {
            var participantsForThisHearing = hearing.Participants.ToList();

            return new UpdateHearingParticipantsRequestV2
            {
                NewParticipants = MapNewParticipants(participantsForThisHearing, participantsForEditedHearing),
                RemovedParticipantIds = MapRemovedParticipantIds(participantsForThisHearing, hearingChanges),
                ExistingParticipants = MapExistingParticipants(participantsForThisHearing, hearingChanges),
                LinkedParticipants = MapLinkedParticipants(participantsForThisHearing, hearingChanges)
            };
        }

        private static List<ParticipantRequestV2> MapNewParticipants(
            List<ParticipantResponseV2> participantsForThisHearing,
            UpdateHearingParticipantsRequestV2 participantsForEditedHearing)
        {
            return participantsForEditedHearing.NewParticipants
                .Where(np => !participantsForThisHearing.Exists(p => p.ContactEmail == np.ContactEmail))
                .ToList();
        }

        private static List<Guid> MapRemovedParticipantIds(
            List<ParticipantResponseV2> participantsForThisHearing,
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

        private static List<UpdateParticipantRequestV2> MapExistingParticipants(
            List<ParticipantResponseV2> participantsForThisHearing,
            HearingChanges hearingChanges)
        {
            var existingParticipants = new List<UpdateParticipantRequestV2>();
            
            // Get the existing participants relative to the edited hearing, and work out which edits were made to them in the request.
            // Apply only these edits to the existing participants for subsequent days in the hearing
            foreach (var existingParticipant in participantsForThisHearing)
            {
                var existingParticipantToAdd = new UpdateParticipantRequestV2
                {
                    Title = existingParticipant.Title,
                    DisplayName = existingParticipant.DisplayName,
                    OrganisationName = existingParticipant.Organisation,
                    TelephoneNumber = existingParticipant.TelephoneNumber,
                    Representee = existingParticipant.Representee,
                    ParticipantId = existingParticipant.Id
                };

                if (hearingChanges.RemovedParticipants.Exists(x => x.ContactEmail == existingParticipant.ContactEmail))
                {
                    continue;
                }
                
                var participantInRequest = hearingChanges.ParticipantChanges.Find(x => x.ParticipantRequest.ContactEmail == existingParticipant.ContactEmail);
                
                if (participantInRequest != null)
                {
                    var participantRequest = participantInRequest.ParticipantRequest;

                    existingParticipantToAdd.Title = participantInRequest.TitleChanged ?
                        participantRequest.Title : existingParticipantToAdd.Title;
                    existingParticipantToAdd.DisplayName = participantInRequest.DisplayNameChanged ?
                        participantRequest.DisplayName : existingParticipantToAdd.DisplayName;
                    existingParticipantToAdd.OrganisationName = participantInRequest.OrganisationNameChanged ?
                        participantRequest.OrganisationName : existingParticipantToAdd.OrganisationName;
                    existingParticipantToAdd.TelephoneNumber = participantInRequest.TelephoneChanged ?
                        participantRequest.TelephoneNumber : existingParticipantToAdd.TelephoneNumber;
                    existingParticipantToAdd.Representee = participantInRequest.RepresenteeChanged ?
                        participantRequest.Representee : existingParticipantToAdd.Representee;
                }
                
                existingParticipants.Add(existingParticipantToAdd);
            }

            return existingParticipants;
        }

        private static List<LinkedParticipantRequestV2> MapLinkedParticipants(
            List<ParticipantResponseV2> participantsForThisHearing,
            HearingChanges hearingChanges)
        {
            // Linked participants
            
            // Put the existing linked participants for this hearing into the request

            var existingLinkedParticipants = new List<LinkedParticipantRequest>();
            var linkedParticipantsForThisHearing = participantsForThisHearing
                .Where(x => x.LinkedParticipants != null)
                .SelectMany(x => x.LinkedParticipants)
                .ToList();

            foreach (var linkedId in linkedParticipantsForThisHearing.Select(linkedParticipant => linkedParticipant.LinkedId))
            {
                var linked = participantsForThisHearing.Find(x => x.Id == linkedId);
                var participant = participantsForThisHearing
                    .First(x => x.LinkedParticipants.Exists(y => y.LinkedId == linkedId));

                if (existingLinkedParticipants.Exists(p => p.ParticipantContactEmail == linked.ContactEmail))
                {
                    // Avoid mapping them twice
                    continue;
                }
                
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

            return linkedParticipants.Select(lp => lp.MapToV2()).ToList();
        }
    }
}
