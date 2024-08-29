using System;
using System.Linq;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;

namespace AdminWebsite.Services
{
    public interface IConferenceDetailsService
    {
        Task<ConferenceDetailsResponse> GetConferenceDetailsByHearingId(Guid hearingId, bool includeClosed = false);
    }
    
    public class ConferenceDetailsService(IVideoApiClient videoApiClient) : IConferenceDetailsService
    {
        public async Task<ConferenceDetailsResponse> GetConferenceDetailsByHearingId(Guid hearingId, bool includeClosed = false)
        {
            var request = new GetConferencesByHearingIdsRequest { HearingRefIds = [hearingId], IncludeClosed = includeClosed };
            var response = await videoApiClient.GetConferenceDetailsByHearingRefIdsAsync(request);
            return response.FirstOrDefault();
        }
    }
}
