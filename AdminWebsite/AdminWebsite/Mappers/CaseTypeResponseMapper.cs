using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.Mappers;

public static class CaseTypeResponseMapper
{
    public static CaseTypeResponse Map(this CaseTypeResponseV2 response) =>
        new()
        {
            Id = response.Id,
            Name = response.Name,
            ServiceId = response.ServiceId,
            IsAudioRecordingAllowed = response.IsAudioRecordingAllowed
        };
}