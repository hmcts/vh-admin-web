using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.Mappers
{
    public static class HearingRoleResponseMapper
    {
        public static HearingRoleResponse Map(this HearingRoleResponseV2 hearingRoleResponse)
        {
            return new HearingRoleResponse
            {
                Name = hearingRoleResponse.Name,
                UserRole = hearingRoleResponse.UserRole,
                Code = hearingRoleResponse.Code,
                WelshName = hearingRoleResponse.WelshName
            };
        }
    }
}
