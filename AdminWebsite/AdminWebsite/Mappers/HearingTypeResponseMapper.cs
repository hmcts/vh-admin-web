using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.Mappers;

public static class HearingTypeResponseMapper
{
    public static HearingTypeResponse Map(this CaseTypeResponseV2 response) =>
        new()
        {
            Group = response.Name,
            Id = response.Id,
            ServiceId = response.ServiceId,
            IsAudioRecordingAllowed = response.IsAudioRecordingAllowed
        };
}