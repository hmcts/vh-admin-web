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
using AdminWebsite.Exceptions;
using AdminWebsite.Helper;
using BookingsApi.Contract.Interfaces.Requests;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;
using JudiciaryParticipantRequest = AdminWebsite.Contracts.Requests.JudiciaryParticipantRequest;

namespace AdminWebsite.Services;

public interface IHearingsService
{
    Task CancelMultiDayHearing(CancelMultiDayHearingRequest request, Guid hearingId, Guid groupId, string updatedBy);
    Task<HearingDetailsResponse> BookNewHearing(BookHearingRequest request, string createdBy);
    Task UpdateHearing(EditHearingRequest request, Guid hearingId, HearingDetailsResponse originalHearing, string updatedBy);
    Task UpdateMultiDayHearing(EditMultiDayHearingRequest request, Guid hearingId, Guid groupId, string updatedBy);
    Task CloneHearing(Guid hearingId, MultiHearingRequest hearingRequest);
}

public class HearingsService(IBookingsApiClient bookingsApiClient, ILogger<HearingsService> logger) : IHearingsService
{
    #pragma warning disable S107
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
        await bookingsApiClient.UpdateHearingParticipantsV2Async(hearingId, updateHearingParticipantsRequest);
    }

    public static void UpdateEndpointWithNewlyAddedParticipant(List<IParticipantRequest> newParticipantList, EditEndpointRequest endpoint)
    {
        if(endpoint.LinkedParticipantEmails == null || endpoint.LinkedParticipantEmails.Count == 0)
           return;
        
        var epToUpdate = newParticipantList
            .Where(p => endpoint.LinkedParticipantEmails.Contains(p.ContactEmail, StringComparer.CurrentCultureIgnoreCase))
            .ToList();
        
        if (epToUpdate.Count > 0)
            endpoint.LinkedParticipantEmails = epToUpdate.Select(p => p.ContactEmail).ToList();
    }
        
    public async Task CancelMultiDayHearing(
        CancelMultiDayHearingRequest request, 
        Guid hearingId, 
        Guid groupId,
        string updatedBy)
    {
        var hearingsInMultiDay = await bookingsApiClient.GetHearingsByGroupIdV2Async(groupId);
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

        await bookingsApiClient.CancelHearingsInGroupAsync(groupId, cancelRequest);
    }

    public async Task CloneHearing(Guid hearingId, MultiHearingRequest hearingRequest)
    {
        logger.LogDebug("Attempting to clone hearing {Hearing}", hearingId);

        var hearingDates = GetDatesForClonedHearings(hearingRequest);
            
        if (hearingDates.Count == 0)
        {
            const string errorMessage = "No working dates provided to clone to";
            logger.LogWarning(errorMessage);
            throw new ServiceException(errorMessage);
        }

        var cloneHearingRequest = new CloneHearingRequestV2()
        {
            Dates = hearingDates, 
            ScheduledDuration = hearingRequest.ScheduledDuration
        };
            
        logger.LogDebug("Sending request to clone hearing to Bookings API");
        await bookingsApiClient.CloneHearingAsync(hearingId, cloneHearingRequest);
        logger.LogDebug("Successfully cloned hearing {Hearing}", hearingId);
    }

    public async Task<HearingDetailsResponse> BookNewHearing(BookHearingRequest request, string createdBy)
    {
        var newBookingRequest = request.BookingDetails;
        newBookingRequest.IsMultiDayHearing = request.IsMultiDay;
        newBookingRequest.CreatedBy = createdBy;
            
        logger.LogInformation("BookNewHearing - Attempting to send booking request to Booking API");
        var newBookingRequestV2 = newBookingRequest.MapToV2();
        var hearingDetailsResponse = await bookingsApiClient.BookNewHearingWithCodeAsync(newBookingRequestV2);
        var hearingId = hearingDetailsResponse.Id;
        var response = hearingDetailsResponse.Map();
        logger.LogInformation("BookNewHearing - Successfully booked hearing {Hearing}", hearingId);
        return response;
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
        await bookingsApiClient.UpdateHearingDetailsV2Async(hearingId, updateHearingRequestV2);
        await UpdateParticipantsAndEndpointsV2(hearingId, request.Participants, request.Endpoints, originalHearing);
        await UpdateJudiciaryParticipants(hearingId, request.JudiciaryParticipants, originalHearing);
    }
        
    public async Task UpdateMultiDayHearing(
        EditMultiDayHearingRequest request, 
        Guid hearingId, 
        Guid groupId,
        string updatedBy)
    {
        var hearingsInMultiDay = await bookingsApiClient.GetHearingsByGroupIdV2Async(groupId);
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

        await bookingsApiClient.UpdateHearingsInGroupV2Async(groupId, bookingsApiRequest);
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
            await bookingsApiClient.ReassignJudiciaryJudgeAsync(hearingId, new ReassignJudiciaryJudgeRequest
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
                
            await bookingsApiClient.RemoveJudiciaryParticipantFromHearingAsync(hearingId, removedJoh.PersonalCode);
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
            await bookingsApiClient.AddJudiciaryParticipantsToHearingAsync(hearingId, johsToAdd);
        }

        foreach (var joh in request.ExistingJudiciaryParticipants)
        {
            var roleCode = joh.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge ? JudiciaryParticipantHearingRoleCode.Judge
                : JudiciaryParticipantHearingRoleCode.PanelMember;
                
            await bookingsApiClient.UpdateJudiciaryParticipantAsync(hearingId, joh.PersonalCode,
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
            logger.LogDebug("Removing endpoint {Endpoint} - {EndpointDisplayName} from hearing {Hearing}",
                endpointToDelete.Id, endpointToDelete.DisplayName, hearing.Id);
            await bookingsApiClient.RemoveEndPointFromHearingAsync(hearing.Id, endpointToDelete.Id);
        }
    }

    private async Task AddEndpointToHearing(Guid hearingId, HearingDetailsResponse hearing,
        EditEndpointRequest endpoint)
    {
        logger.LogDebug("Adding endpoint {EndpointDisplayName} to hearing {Hearing}",
            endpoint.DisplayName, hearingId);
        var addEndpointRequest = new EndpointRequestV2()
        {
            DisplayName = endpoint.DisplayName,
            LinkedParticipantEmails = endpoint.LinkedParticipantEmails,
            InterpreterLanguageCode = endpoint.InterpreterLanguageCode,
            Screening = endpoint.ScreeningRequirements.MapToV2(),
            ExternalParticipantId = endpoint.ExternalReferenceId
        };
        await bookingsApiClient.AddEndPointToHearingV2Async(hearing.Id, addEndpointRequest);
    }

    private async Task UpdateEndpointInHearing(Guid hearingId, HearingDetailsResponse hearing, EditEndpointRequest endpoint,
        IEnumerable<IParticipantRequest> newParticipantList)
    {
        var request = UpdateEndpointRequestV2Mapper.Map(hearing, endpoint, newParticipantList);
        if (request == null) return;
            
        logger.LogDebug("Updating endpoint {Endpoint} - {EndpointDisplayName} in hearing {Hearing}",
            endpoint.Id, endpoint.DisplayName, hearingId);
            
        await bookingsApiClient.UpdateEndpointV2Async(hearing.Id, endpoint.Id!.Value, request);
    }
        
    private static List<DateTime> GetDatesForClonedHearings(MultiHearingRequest hearingRequest)
    {
        if (hearingRequest.HearingDates != null && hearingRequest.HearingDates.Any())
        {
            return hearingRequest.HearingDates.Skip(1).ToList();
        }
            
        if (DateListMapper.IsWeekend(hearingRequest.StartDate) || DateListMapper.IsWeekend(hearingRequest.EndDate))
        {
            return DateListMapper.GetListOfDates(hearingRequest.StartDate, hearingRequest.EndDate);
        }
            
        return DateListMapper.GetListOfWorkingDates(hearingRequest.StartDate, hearingRequest.EndDate);
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
}