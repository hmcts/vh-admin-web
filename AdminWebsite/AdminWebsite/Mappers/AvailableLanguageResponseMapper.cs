using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Responses;

namespace AdminWebsite.Mappers;

public static class AvailableLanguageResponseMapper
{
    public static AvailableLanguageResponse Map(this BookingsApi.Contract.V1.Responses.InterpreterLanguagesResponse languagesResponse)
    {
        return new AvailableLanguageResponse()
        {
            Code = languagesResponse.Code,
            Description = languagesResponse.Value,
            Type = (InterprepretationType)languagesResponse.Type
        };
    }
}