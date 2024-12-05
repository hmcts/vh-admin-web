using AdminWebsite.Contracts.Responses;
using AdminWebsite.Models;
using V2 = BookingsApi.Contract.V2.Responses;

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
        public static EditEndpointRequest MapFrom(V2.EndpointResponseV2 response)
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
