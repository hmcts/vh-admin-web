using AdminWebsite.Contracts.Responses;
using AdminWebsite.Models;
using V1 = BookingsApi.Contract.V1.Responses;

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
        public static EditEndpointRequest MapFrom(V1.EndpointResponse response)
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
