using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Requests;
using JudiciaryParticipantRequest = AdminWebsite.Contracts.Requests.JudiciaryParticipantRequest;

namespace AdminWebsite.Mappers;

public static class EditableJudiciaryParticipantRequestMapper
{
    public static List<EditableUpdateJudiciaryParticipantRequest> Map(
        IEnumerable<JudiciaryParticipantRequest> judiciaryParticipantsToUpdate, 
        HearingDetailsResponse originalHearing, 
        bool skipUnchangedParticipants = true, 
        List<string> removedJudiciaryParticipantPersonalCodes = null)
    {
        // get existing judiciary participants based on the personal code being present in the original hearing
        var existingJohs = judiciaryParticipantsToUpdate.Where(jp =>
            originalHearing.JudiciaryParticipants.Exists(ojp => ojp.PersonalCode == jp.PersonalCode)).ToList();

        if (removedJudiciaryParticipantPersonalCodes != null)
        {
            // Get the existing judiciary participants on this hearing
            existingJohs = originalHearing.JudiciaryParticipants
                .Select(jp => new JudiciaryParticipantRequest
                {
                    PersonalCode = jp.PersonalCode,
                    Role = jp.RoleCode.ToString(),
                    DisplayName = jp.DisplayName,
                    OptionalContactTelephone = jp.OptionalContactTelephone,
                    OptionalContactEmail = jp.OptionalContactEmail,
                    InterpreterLanguageCode = jp.InterpreterLanguage?.Code
                })
                .ToList();
            
            // Exclude any that have been explicitly removed as part of this request
            existingJohs = existingJohs
                .Where(e => removedJudiciaryParticipantPersonalCodes
                    .TrueForAll(d => d != e.PersonalCode))
                .ToList();
        }

        var existingJudiciaryParticipants = new List<EditableUpdateJudiciaryParticipantRequest>();
        
        foreach (var joh in existingJohs)
        {
            if (skipUnchangedParticipants)
            {
                // Only update the joh if their details have changed
                var originalJoh = originalHearing.JudiciaryParticipants.Find(x => x.PersonalCode == joh.PersonalCode);
                if (joh.DisplayName == originalJoh.DisplayName &&
                    joh.Role == originalJoh.RoleCode &&
                    joh.InterpreterLanguageCode == originalJoh.InterpreterLanguage?.Code)
                {
                    continue;
                }
            }
            
            var roleCode = Enum.Parse<JudiciaryParticipantHearingRoleCode>(joh.Role);
            existingJudiciaryParticipants.Add(new EditableUpdateJudiciaryParticipantRequest
            {
                PersonalCode = joh.PersonalCode,
                DisplayName = joh.DisplayName,
                HearingRoleCode = roleCode == JudiciaryParticipantHearingRoleCode.Judge ? JudiciaryParticipantHearingRoleCode.Judge
                    : JudiciaryParticipantHearingRoleCode.PanelMember,
                InterpreterLanguageCode = joh.InterpreterLanguageCode
            });
        }

        return existingJudiciaryParticipants;
    }
}