using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Models;
using AdminWebsite.Models.EditMultiDayHearing;
using LinkedParticipant = AdminWebsite.Models.EditMultiDayHearing.LinkedParticipant;

namespace AdminWebsite.Mappers.EditMultiDayHearing
{
    public static class HearingChangesMapper
    {
        public static HearingChanges MapHearingChanges(BookingsApi.Contract.V1.Responses.HearingDetailsResponse hearing, EditMultiDayHearingRequest request)
        {
            var hearingChanges = new HearingChanges();
            
            // Hearing details
            if (request.ScheduledDuration != hearing.ScheduledDuration)
            {
                hearingChanges.ScheduledDurationChanged = true;
            }

            if (request.HearingVenueName != hearing.HearingVenueName)
            {
                hearingChanges.HearingVenueNameChanged = true;
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
            
            return hearingChanges;
        }

        private static List<ParticipantChanges> MapParticipantChanges(BookingsApi.Contract.V1.Responses.HearingDetailsResponse hearing, EditMultiDayHearingRequest request)
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
            BookingsApi.Contract.V1.Responses.HearingDetailsResponse hearing, 
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
                
                // LinkedId = hearing.Participants.Find(y => y.ContactEmail == x.LinkedParticipantContactEmail)?.Id ?? Guid.Empty,

                if (linkedParticipantInRequest.LinkedParticipantContactEmail == null)
                {
                    var linkedParticipant = hearing.Participants.Find(x => x.Id == linkedParticipantInRequest.LinkedId);

                    linkedParticipantInRequest.LinkedParticipantContactEmail = linkedParticipant.ContactEmail;
                }
            }
            
            // var existingLinkedParticipants = hearing.Participants
            //     .SelectMany(x => x.LinkedParticipants)
            //     .Select(x => new LinkedParticipant
            //     {
            //         LinkedId = x.LinkedId,
            //         LinkedParticipantContactEmail = hearing.Participants.Find(y => y.Id == x.LinkedId)?.ContactEmail,
            //         ParticipantId = x.
            //         Type = LinkedParticipantType.Interpreter
            //     })
            //     .ToList();
            
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
            
            // var removedLinkedParticipants2 = request.Participants
            //     .Where(x => x.LinkedParticipants.Any() &&
            //                 removedParticipantIds.Contains(x.LinkedParticipants[0].LinkedId) ||
            //                 removedParticipantIds.Contains(x.LinkedParticipants[0].ParticipantId))
            //     .ToList();
            
            // TODO We need to extract here the existing linked participants whose id or linked id is in the removedParticipantIds list
            var removedLinkedParticipants = existingLinkedParticipants
                .Where(x => removedParticipantIds.Contains(x.LinkedId) || removedParticipantIds.Contains(x.ParticipantId))
                .ToList();

            // var removedLinkedParticipants = existingLinkedParticipants
            //     .Where(existing => !linkedParticipantsInRequest.Exists(linked => linked.LinkedId == existing.LinkedId))
            //     .ToList();

            linkedParticipantChanges.NewLinkedParticipants = newLinkedParticipants;
            linkedParticipantChanges.RemovedLinkedParticipants = removedLinkedParticipants;

            return linkedParticipantChanges;
        }

        private static IEnumerable<ParticipantResponse> GetRemovedParticipants(List<EditParticipantRequest> participants, HearingDetailsResponse originalHearing)
        {
            return originalHearing.Participants.Where(p => participants.TrueForAll(rp => rp.Id != p.Id))
                .Select(x => x).ToList();
        }

        private static List<EndpointChanges> MapEndpointChanges(BookingsApi.Contract.V1.Responses.HearingDetailsResponse hearing, EditMultiDayHearingRequest request)
        {
            var endpointChanges = new List<EndpointChanges>();
            var endpointsInRequest = request.Endpoints.ToList();
            
            // Existing endpoints
            var existingEndpointsInEditedHearing = hearing.Endpoints.ToList();
            foreach (var endpointInRequest in endpointsInRequest)
            {
                var existingEndpointForEditedHearing = existingEndpointsInEditedHearing.Find(x => x.Id == endpointInRequest.Id);
                
                if (existingEndpointForEditedHearing == null)
                {
                    continue;
                }

                BookingsApi.Contract.V1.Responses.ParticipantResponse existingDefenceAdvocate = null;
                if (existingEndpointForEditedHearing.DefenceAdvocateId != null)
                {
                    existingDefenceAdvocate = hearing.Participants.Find(x => x.Id == existingEndpointForEditedHearing.DefenceAdvocateId.Value);
                }
                
                endpointChanges.Add(new EndpointChanges
                {
                    EndpointRequest = endpointInRequest,
                    DisplayNameChanged = endpointInRequest.DisplayName != existingEndpointForEditedHearing.DisplayName,
                    DefenceAdvocateContactEmailChanged = endpointInRequest.DefenceAdvocateContactEmail != existingDefenceAdvocate?.ContactEmail
                });
            }

            return endpointChanges;
        }

        private static IEnumerable<EndpointResponse> GetRemovedEndpoints(List<EditEndpointRequest> endpoints, HearingDetailsResponse originalHearing)
        {
            return originalHearing.Endpoints.Where(p => endpoints.TrueForAll(rp => rp.Id != p.Id))
                .Select(x => x).ToList();
        }
    }
}
