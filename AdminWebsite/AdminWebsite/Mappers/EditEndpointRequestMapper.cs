using AdminWebsite.Models;
using EndpointResponse = BookingsApi.Contract.V1.Responses.EndpointResponse;

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
                DefenceAdvocateContactEmail =
                    response.DefenceAdvocateId == null ? null : response.DefenceAdvocateId.ToString()
            };

        }
    }
}
