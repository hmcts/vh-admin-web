using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Models;
using BookingsApi.Contract.Responses;

namespace AdminWebsite.Mappers
{
    public static class EditEndpointRequestMapper
    {
        public static EditEndpointRequest MapFrom(EndpointResponse response)
        {
            return new EditEndpointRequest
            {
                Id = response.Id,
                DisplayName = response.DisplayName,
                DefenceAdvocateUsername =
                    response.DefenceAdvocateId == null ? null : response.DefenceAdvocateId.ToString()
            };

        }
    }
}
