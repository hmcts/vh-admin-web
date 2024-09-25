using AdminWebsite.Contracts.Requests;
using BookingsApi.Contract.V2.Enums;

namespace AdminWebsite.Mappers;

public static class ScreeningRequestMapper
{
    public static BookingsApi.Contract.V2.Requests.ScreeningRequest MapToV2(this SpecialMeasureScreeningRequest specialMeasureScreeningRequest)
    {
        if (specialMeasureScreeningRequest == null)
        {
            return null;
        }

        if (specialMeasureScreeningRequest.ScreenAll)
        {
            return new BookingsApi.Contract.V2.Requests.ScreeningRequest() { Type = ScreeningType.All };
        }

        return new BookingsApi.Contract.V2.Requests.ScreeningRequest()
        {
            Type = ScreeningType.Specific,
            ProtectFromParticipants = specialMeasureScreeningRequest.ScreenFromParticipantContactEmails,
            ProtectFromEndpoints = specialMeasureScreeningRequest.ScreenFromJvsDisplayNames
        };
    }
}