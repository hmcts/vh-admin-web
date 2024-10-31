using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Models;
using AdminWebsite.Models.EditMultiDayHearing;
using BookingsApi.Contract.V2.Responses;
using LinkedParticipant = AdminWebsite.Models.EditMultiDayHearing.LinkedParticipant;

namespace AdminWebsite.Mappers.EditMultiDayHearing
{
    public static class HearingChangesMapper
    {
        public static HearingChanges MapHearingChanges(HearingDetailsResponseV2 hearing, EditMultiDayHearingRequest request)
        {
            var hearingChanges = new HearingChanges();
            
            // Hearing details
            if (request.ScheduledDuration != hearing.ScheduledDuration)
            {
                hearingChanges.ScheduledDurationChanged = true;
            }

            if (request.HearingVenueCode != hearing.HearingVenueCode)
            {
                hearingChanges.HearingVenueCodeChanged = true;
            }

            if (request.HearingRoomName != hearing.HearingRoomName)
            {
                hearingChanges.HearingRoomNameChanged = true;
            }

            if (request.OtherInformation != hearing.OtherInformation)
            {
                hearingChanges.OtherInformationChanged = true;
            }

            if (request.CaseNumber != hearing.Cases[0].Number)
            {
                hearingChanges.CaseNumberChanged = true;
            }

            if (request.AudioRecordingRequired != hearing.AudioRecordingRequired)
            {
                hearingChanges.AudioRecordingRequiredChanged = true;
            }
            
            // Participants
            hearingChanges.ParticipantChanges = MapParticipantChanges(hearing, request);
            hearingChanges.RemovedParticipants = GetRemovedParticipants(request.Participants.ToList(), hearing.Map()).ToList();
            
            // Linked participants
            var removedParticipantIds = hearingChanges.RemovedParticipants.Select(x => x.Id).ToList();
            hearingChanges.LinkedParticipantChanges = MapLinkedParticipantChanges(hearing, request, removedParticipantIds);

            // Endpoints
            hearingChanges.EndpointChanges = MapEndpointChanges(hearing, request);
            hearingChanges.RemovedEndpoints = GetRemovedEndpoints(request.Endpoints.ToList(), hearing.Map()).ToList();
            
            // Judiciary participants
            hearingChanges.NewJudiciaryParticipants = GetNewJudiciaryParticipants(hearing, request).ToList();
            hearingChanges.RemovedJudiciaryParticipants = GetRemovedJudiciaryParticipants(request.JudiciaryParticipants.ToList(), hearing.Map()).ToList();
            
            return hearingChanges;
        }

        private static List<ParticipantChanges> MapParticipantChanges(HearingDetailsResponseV2 hearing, EditMultiDayHearingRequest request)
        {
            var participantChanges = new List<ParticipantChanges>();
            var participantsInRequest = request.Participants.ToList();
            
            // Existing participants
            var existingParticipantsInEditedHearing = hearing.Participants.ToList();
            foreach (var participantInRequest in participantsInRequest)
            {
                var existingParticipantForEditedHearing = existingParticipantsInEditedHearing.Find(x => x.Id == participantInRequest.Id);
                if (existingParticipantForEditedHearing == null)
                {
                    continue;
                }

                participantChanges.Add(new ParticipantChanges
                {
                    ParticipantRequest = participantInRequest,
                    TitleChanged = participantInRequest.Title != existingParticipantForEditedHearing.Title,
                    DisplayNameChanged = participantInRequest.DisplayName != existingParticipantForEditedHearing.DisplayName,
                    OrganisationNameChanged = participantInRequest.OrganisationName != existingParticipantForEditedHearing.Organisation,
                    TelephoneChanged = participantInRequest.TelephoneNumber != existingParticipantForEditedHearing.TelephoneNumber,
                    RepresenteeChanged = participantInRequest.Representee != existingParticipantForEditedHearing.Representee
                });
            }

            return participantChanges;
        }

        private static LinkedParticipantChanges MapLinkedParticipantChanges(
            HearingDetailsResponseV2 hearing, 
            EditMultiDayHearingRequest request,
            List<Guid> removedParticipantIds)
        {
            var linkedParticipantChanges = new LinkedParticipantChanges();
            
            var linkedParticipantsInRequest = request.Participants
                .SelectMany(x => x.LinkedParticipants)
                .Select(x => new LinkedParticipant
                {
                    LinkedId = x.LinkedId,
                    LinkedParticipantContactEmail = x.LinkedParticipantContactEmail,
                    ParticipantContactEmail = x.ParticipantContactEmail,
                    Type = x.Type
                })
                .ToList();

            foreach (var linkedParticipantInRequest in linkedParticipantsInRequest)
            {
                // New interpreters will have a LinkedParticipantContactEmail and ParticipantContactEmail, but no LinkedId
                // Updated and removed interpreters will have a LinkedId, but no LinkedParticipantContactEmail or ParticipantContactEmail
                // For our purposes, we need at least the LinkedParticipantContactEmail populated so that we can map across different hearings
      
                if (linkedParticipantInRequest.LinkedParticipantContactEmail == null)
                {
                    var linkedParticipant = hearing.Participants.Find(x => x.Id == linkedParticipantInRequest.LinkedId);

                    linkedParticipantInRequest.LinkedParticipantContactEmail = linkedParticipant.ContactEmail;
                }
            }

            var existingLinkedParticipants = hearing.Participants
                .Where(participant => participant.LinkedParticipants != null)
                .SelectMany(participant => participant.LinkedParticipants?.Select(linkedParticipant => new LinkedParticipant
                {
                    ParticipantId = participant.Id,
                    LinkedId = linkedParticipant.LinkedId,
                    LinkedParticipantContactEmail = hearing.Participants.Find(y => y.Id == linkedParticipant.LinkedId)?.ContactEmail,
                    Type = LinkedParticipantType.Interpreter
                }))
                .ToList();

            var newLinkedParticipants = linkedParticipantsInRequest
                .Where(linked => !existingLinkedParticipants.Exists(existing => existing.LinkedId == linked.LinkedId && existing.Type == linked.Type))
                .ToList();

            var removedLinkedParticipants = existingLinkedParticipants
                .Where(x => removedParticipantIds.Contains(x.LinkedId) || removedParticipantIds.Contains(x.ParticipantId))
                .ToList();

            linkedParticipantChanges.NewLinkedParticipants = newLinkedParticipants;
            linkedParticipantChanges.RemovedLinkedParticipants = removedLinkedParticipants;

            return linkedParticipantChanges;
        }

        private static List<ParticipantResponse> GetRemovedParticipants(List<EditParticipantRequest> participants, HearingDetailsResponse originalHearing)
        {
            return originalHearing.Participants
                .Where(p => participants.TrueForAll(rp => rp.Id != p.Id))
                .Select(x => x)
                .ToList();
        }

        private static List<EndpointChanges> MapEndpointChanges(HearingDetailsResponseV2 hearing, EditMultiDayHearingRequest request)
        {
            var endpointChanges = new List<EndpointChanges>();
            var endpointsInRequest = request.Endpoints.ToList();

            var existingEndpointsInEditedHearing = hearing.Endpoints.ToList();
            foreach (var endpointInRequest in endpointsInRequest)
            {
                var existingEndpointForEditedHearing = existingEndpointsInEditedHearing.Find(x => x.Id == endpointInRequest.Id);
                
                if (existingEndpointForEditedHearing == null)
                {
                    continue;
                }

                endpointChanges.Add(new EndpointChanges
                {
                    EndpointRequest = endpointInRequest,
                    OriginalDisplayName = existingEndpointForEditedHearing.DisplayName
                });
            }

            return endpointChanges;
        }

        private static List<EndpointResponse> GetRemovedEndpoints(List<EditEndpointRequest> endpoints, HearingDetailsResponse originalHearing)
        {
            return originalHearing.Endpoints
                .Where(p => endpoints.TrueForAll(rp => rp.Id != p.Id))
                .Select(x => x)
                .ToList();
        }

        private static List<JudiciaryParticipantRequest> GetNewJudiciaryParticipants(HearingDetailsResponseV2 hearing, EditMultiDayHearingRequest request)
        {
            return request.JudiciaryParticipants
                .Where(rjp => !hearing.JudiciaryParticipants.Exists(jp => jp.PersonalCode == rjp.PersonalCode))
                .ToList();
        }
        
        private static List<JudiciaryParticipantResponse> GetRemovedJudiciaryParticipants(
            List<JudiciaryParticipantRequest> judiciaryParticipants, 
            HearingDetailsResponse originalHearing)
        {
            return originalHearing.JudiciaryParticipants
                .Where(jp => judiciaryParticipants.TrueForAll(rp => rp.PersonalCode != jp.PersonalCode))
                .Select(x => x)
                .ToList();
        }
    }
}
