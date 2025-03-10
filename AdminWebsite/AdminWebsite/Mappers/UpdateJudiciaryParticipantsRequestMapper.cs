using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Models.EditMultiDayHearing;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Requests;
using JudiciaryParticipantRequest = AdminWebsite.Contracts.Requests.JudiciaryParticipantRequest;

namespace AdminWebsite.Mappers;

public static class UpdateJudiciaryParticipantsRequestMapper
{
    public static UpdateJudiciaryParticipantsRequest Map(
        List<JudiciaryParticipantRequest> judiciaryParticipants, 
        HearingDetailsResponse originalHearing, 
        bool skipUnchangedParticipants = true, 
        HearingChanges hearingChanges = null)
    {
        var request = new UpdateJudiciaryParticipantsRequest();
        
        // keep the order of removal first. this will allow admin web to change judiciary judges post booking
        var removedJohs = originalHearing.JudiciaryParticipants.Where(ojp =>
            judiciaryParticipants.TrueForAll(jp => jp.PersonalCode != ojp.PersonalCode)).ToList();
        if (hearingChanges != null)
        {
            removedJohs = new List<JudiciaryParticipantResponse>();
            
            if (hearingChanges.RemovedJudiciaryParticipants.Exists(x => x.RoleCode == JudiciaryParticipantHearingRoleCode.Judge.ToString()))
            {
                // If the judge is removed as part of the request, then they are being reassigned, so need to remove the existing judge for this hearing regardless
                var existingJudge = originalHearing.JudiciaryParticipants.First(x => x.RoleCode == JudiciaryParticipantHearingRoleCode.Judge.ToString());
                removedJohs.Add(existingJudge);
            }
            else
            {
                // Only remove judiciary participants that have been explicitly removed as part of this request, if they exist on this hearing
                removedJohs = originalHearing.JudiciaryParticipants
                    .Where(ojp => hearingChanges.RemovedJudiciaryParticipants
                        .Exists(jp => jp.PersonalCode == ojp.PersonalCode))
                    .ToList();
            }
        }
        foreach (var removedJoh in removedJohs)
        {
            request.RemovedJudiciaryParticipantPersonalCodes.Add(removedJoh.PersonalCode);
        }
        
        var newJohs = judiciaryParticipants.Where(jp =>
            !originalHearing.JudiciaryParticipants.Exists(ojp => ojp.PersonalCode == jp.PersonalCode)).ToList();
        if (hearingChanges != null)
        {
            // Only add judiciary participants that have been explicitly added as part of this request
            newJohs = hearingChanges.NewJudiciaryParticipants.ToList();
        }

        var newJohRequest = newJohs.Select(jp =>
        {
            var roleCode = Enum.Parse<JudiciaryParticipantHearingRoleCode>(jp.Role);
            return new BookingsApi.Contract.V2.Requests.JudiciaryParticipantRequest()
            {
                DisplayName = jp.DisplayName,
                PersonalCode = jp.PersonalCode,
                HearingRoleCode = roleCode,
                ContactEmail = jp.OptionalContactEmail,
                InterpreterLanguageCode = jp.InterpreterLanguageCode
            };
        }).ToList();
        if (newJohRequest.Count != 0)
        {
            var johsToAdd = newJohRequest
                .ToList();

            if (johsToAdd.Count != 0)
            {
                var newParticipants = johsToAdd
                    .Select(x => new BookingsApi.Contract.V2.Requests.JudiciaryParticipantRequest
                    {
                        ContactEmail = x.ContactEmail,
                        DisplayName = x.DisplayName,
                        PersonalCode = x.PersonalCode,
                        HearingRoleCode = x.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge ? JudiciaryParticipantHearingRoleCode.Judge
                            : JudiciaryParticipantHearingRoleCode.PanelMember,
                        ContactTelephone = x.ContactTelephone,
                        InterpreterLanguageCode = x.InterpreterLanguageCode
                    })
                    .ToList();
                
                request.NewJudiciaryParticipants.AddRange(newParticipants);
            }
        }
        
        request.ExistingJudiciaryParticipants = EditableJudiciaryParticipantRequestMapper.Map(judiciaryParticipants, 
            originalHearing, 
            skipUnchangedParticipants: skipUnchangedParticipants,
            removedJudiciaryParticipantPersonalCodes: hearingChanges != null ? request.RemovedJudiciaryParticipantPersonalCodes : null);

        return request;
    }
}