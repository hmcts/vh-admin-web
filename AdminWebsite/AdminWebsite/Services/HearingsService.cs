using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Client;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.Interfaces.Requests;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;
using JudiciaryParticipantRequest = AdminWebsite.Contracts.Requests.JudiciaryParticipantRequest;

namespace AdminWebsite.Services
{
    public interface IHearingsService
    {
        void AssignEndpointDefenceAdvocates(List<EndpointRequest> endpointsWithDa, IReadOnlyCollection<ParticipantRequest> participants);
        Task CancelMultiDayHearing(CancelMultiDayHearingRequest request, Guid hearingId, Guid groupId, string updatedBy);
        Task UpdateHearing(EditHearingRequest request, Guid hearingId, HearingDetailsResponse originalHearing, string updatedBy);
        Task UpdateMultiDayHearing(EditMultiDayHearingRequest request, Guid hearingId, Guid groupId, string updatedBy);
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

        public void AssignEndpointDefenceAdvocates(List<EndpointRequest> endpointsWithDa, IReadOnlyCollection<ParticipantRequest> participants)
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

        private async Task ProcessEndpoints(Guid hearingId, List<EditEndpointRequest> endpoints, HearingDetailsResponse hearing,
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

        public static void UpdateEndpointWithNewlyAddedParticipant(List<IParticipantRequest> newParticipantList, EditEndpointRequest endpoint)
        {
            var epToUpdate = newParticipantList
                .Find(p => p.ContactEmail.Equals(endpoint.DefenceAdvocateContactEmail,
                    StringComparison.CurrentCultureIgnoreCase));
            if (epToUpdate != null)
                endpoint.DefenceAdvocateContactEmail = epToUpdate.ContactEmail;
        }
        
        public async Task CancelMultiDayHearing(
            CancelMultiDayHearingRequest request, 
            Guid hearingId, 
            Guid groupId,
            string updatedBy)
        {
            var hearingsInMultiDay = await _bookingsApiClient.GetHearingsByGroupIdV2Async(groupId);
            var thisHearing = hearingsInMultiDay.First(x => x.Id == hearingId);
            
            var hearingsToCancel = new List<HearingDetailsResponseV2>
            {
                thisHearing
            };
            
            if (request.UpdateFutureDays)
            {
                var futureHearings = hearingsInMultiDay.Where(x => x.ScheduledDateTime.Date > thisHearing.ScheduledDateTime.Date);
                hearingsToCancel.AddRange(futureHearings.ToList());
            }

            // Hearings with these statuses will be rejected by bookings api, so filter them out
            hearingsToCancel = hearingsToCancel
                .Where(h => 
                    h.Status != BookingStatusV2.Cancelled && 
                    h.Status != BookingStatusV2.Failed)
                .ToList();

            var cancelRequest = new CancelHearingsInGroupRequest
            {
                HearingIds = hearingsToCancel.Select(h => h.Id).ToList(),
                CancelReason = request.CancelReason,
                UpdatedBy = updatedBy
            };

            await _bookingsApiClient.CancelHearingsInGroupAsync(groupId, cancelRequest);
        }

        public async Task UpdateHearing(
            EditHearingRequest request, 
            Guid hearingId, 
            HearingDetailsResponse originalHearing,
            string updatedBy)
        {
            //Save hearing details
            
            // Adding an interpreter forces the audio recording to be required. The update hearing details do not work
            // with the close to start time window, but the domain will update the audio recording required flag when
            // an interpreter is added. Revert to the original audio recording setting to avoid the time clash.
            // This is only an issue because we update hearing details and participants in the same request.
            var containsInterpreter =
                request.Participants.Exists(p => p.IsInterpreter());
            
            if(containsInterpreter)
            {
                // revert to the original audio recording setting if an interpreter is added so that the domain rules
                // kick in rather than using update hearing details which do not work with the close to start time window
                request.AudioRecordingRequired = originalHearing.AudioRecordingRequired;
            }
            
            var updateHearingRequestV2 = HearingUpdateRequestMapper.MapToV2(request, updatedBy);
            await _bookingsApiClient.UpdateHearingDetailsV2Async(hearingId, updateHearingRequestV2);
            await UpdateParticipantsAndEndpointsV2(hearingId, request.Participants, request.Endpoints, originalHearing);
            await UpdateJudiciaryParticipants(hearingId, request.JudiciaryParticipants, originalHearing);
        }
        
        public async Task UpdateMultiDayHearing(
            EditMultiDayHearingRequest request, 
            Guid hearingId, 
            Guid groupId,
            string updatedBy)
        {
            var hearingsInMultiDay = await _bookingsApiClient.GetHearingsByGroupIdV2Async(groupId);
            var thisHearing = hearingsInMultiDay.First(x => x.Id == hearingId);
            
            var hearingsToUpdate = new List<HearingDetailsResponseV2>
            {
                thisHearing
            };
            
            if (request.UpdateFutureDays)
            {
                var futureHearings = hearingsInMultiDay.Where(x => x.ScheduledDateTime.Date > thisHearing.ScheduledDateTime.Date);
                hearingsToUpdate.AddRange(futureHearings);
            }
            
            hearingsToUpdate = hearingsToUpdate
                .Where(h => 
                    h.Status != BookingStatusV2.Cancelled && 
                    h.Status != BookingStatusV2.Failed)
                .ToList();

            var bookingsApiRequest = UpdateHearingsInGroupRequestMapper.Map(
                hearingsToUpdate, 
                hearingId, 
                request, 
                updatedBy);

            await _bookingsApiClient.UpdateHearingsInGroupV2Async(groupId, bookingsApiRequest);
        }
        
        private async Task UpdateJudiciaryParticipants(
            Guid hearingId, 
            List<JudiciaryParticipantRequest> judiciaryParticipants,
            HearingDetailsResponse originalHearing)
        {
            var request = UpdateJudiciaryParticipantsRequestMapper.Map(judiciaryParticipants, originalHearing);
            
            // Due to booking api's domain restrictions for removing participants, we have to update judges differently
            var oldJudge = originalHearing.JudiciaryParticipants.Find(ojp => ojp.RoleCode == JudiciaryParticipantHearingRoleCode.Judge.ToString());
            var newJudge = judiciaryParticipants.Find(njp => njp.Role == JudiciaryParticipantHearingRoleCode.Judge.ToString());
            if (oldJudge?.PersonalCode != newJudge?.PersonalCode && newJudge != null)
            {
                await _bookingsApiClient.ReassignJudiciaryJudgeAsync(hearingId, new ReassignJudiciaryJudgeRequest
                {
                    DisplayName = newJudge.DisplayName,
                    PersonalCode = newJudge.PersonalCode,
                    OptionalContactEmail = newJudge.OptionalContactEmail,
                    InterpreterLanguageCode = newJudge.InterpreterLanguageCode
                });
            }

            foreach (var removedJohPersonalCode in request.RemovedJudiciaryParticipantPersonalCodes)
            {
                var removedJoh = originalHearing.JudiciaryParticipants.Find(p => p.PersonalCode == removedJohPersonalCode);
                if (removedJoh.RoleCode == JudiciaryParticipantHearingRoleCode.Judge.ToString())
                {
                    // Judges are re-assigned instead of removed or added
                    continue;
                }
                
                await _bookingsApiClient.RemoveJudiciaryParticipantFromHearingAsync(hearingId, removedJoh.PersonalCode);
            }

            var johsToAdd = request.NewJudiciaryParticipants
                .Select(jp => new BookingsApi.Contract.V2.Requests.JudiciaryParticipantRequest()
                {
                    DisplayName = jp.DisplayName,
                    PersonalCode = jp.PersonalCode,
                    HearingRoleCode = jp.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge ? JudiciaryParticipantHearingRoleCode.Judge
                        : JudiciaryParticipantHearingRoleCode.PanelMember,
                    InterpreterLanguageCode = jp.InterpreterLanguageCode
                })
                // Judges are re-assigned instead of removed or added
                .Where(jp => jp.HearingRoleCode != JudiciaryParticipantHearingRoleCode.Judge)
                .ToList();
         
            if (johsToAdd.Count != 0)
            {
                await _bookingsApiClient.AddJudiciaryParticipantsToHearingAsync(hearingId, johsToAdd);
            }

            foreach (var joh in request.ExistingJudiciaryParticipants)
            {
                var roleCode = joh.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge ? JudiciaryParticipantHearingRoleCode.Judge
                    : JudiciaryParticipantHearingRoleCode.PanelMember;
                
                await _bookingsApiClient.UpdateJudiciaryParticipantAsync(hearingId, joh.PersonalCode,
                    new UpdateJudiciaryParticipantRequest
                    {
                        DisplayName = joh.DisplayName, 
                        HearingRoleCode = roleCode, 
                        InterpreterLanguageCode = joh.InterpreterLanguageCode
                    });
            }
        }
        
        private async Task UpdateParticipantsAndEndpointsV2(
            Guid hearingId, List<EditParticipantRequest> participants, 
            List<EditEndpointRequest> endpoints, 
            HearingDetailsResponse originalHearing)
        {
            var request = UpdateHearingParticipantsRequestV2Mapper.Map(hearingId, participants, originalHearing);

            if (participants.Count != 0 || request.RemovedParticipantIds.Count != 0)
                await ProcessParticipantsV2(hearingId, request.ExistingParticipants, request.NewParticipants, request.RemovedParticipantIds, request.LinkedParticipants);
            
            await ProcessEndpoints(hearingId, endpoints, originalHearing, new List<IParticipantRequest>(request.NewParticipants));
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
            var request = UpdateEndpointRequestV2Mapper.Map(hearing, endpoint, newParticipantList);
            if (request == null) return;
            
            _logger.LogDebug("Updating endpoint {Endpoint} - {EndpointDisplayName} in hearing {Hearing}",
                endpoint.Id, endpoint.DisplayName, hearingId);
            
            await _bookingsApiClient.UpdateEndpointV2Async(hearing.Id, endpoint.Id!.Value, request);
        }
    }
}