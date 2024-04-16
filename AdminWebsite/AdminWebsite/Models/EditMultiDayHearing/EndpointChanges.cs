using BookingsApi.Contract.V1.Requests;

namespace AdminWebsite.Models.EditMultiDayHearing
{
    public class EndpointChanges
    {
        public EditEndpointRequest EndpointRequest { get; set; }
        public string OriginalDisplayName { get; set; }
    }
}
