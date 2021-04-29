using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VideoApi.Client;
using VideoApi.Contract.Responses;

namespace AdminWebsite.Services
{
    public interface IConferencesService
    {
        Task<ConferenceDetailsResponse> GetConferenceDetailsByHearingIdWithRetry(Guid hearingId, string errorMessage);

        Task<ConferenceDetailsResponse> GetConferenceDetailsByHearingId(Guid hearingId);
    }
    
    public class ConferencesService : IConferencesService
    {
        private readonly IPollyRetryService _pollyRetryService;
        private readonly ILogger<ConferencesService> _logger;
        private readonly IVideoApiClient _videoApiClient;

        public ConferencesService(IPollyRetryService pollyRetryService, ILogger<ConferencesService> logger, IVideoApiClient videoApiClient)
        {
            _pollyRetryService = pollyRetryService;
            _logger = logger;
            _videoApiClient = videoApiClient;
        }

        public async Task<ConferenceDetailsResponse> GetConferenceDetailsByHearingIdWithRetry(Guid hearingId, string errorMessage)
        {
            try
            {
                var details = await _pollyRetryService.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
                (
                    6, _ => TimeSpan.FromSeconds(8),
                    retryAttempt =>
                        _logger.LogWarning(
                            "Failed to retrieve conference details from the VideoAPi for hearingId {Hearing}. Retrying attempt {RetryAttempt}", hearingId, retryAttempt),
                    videoApiResponseObject => !videoApiResponseObject.HasValidMeetingRoom(),
                    () => _videoApiClient.GetConferenceByHearingRefIdAsync(hearingId, false)
                );
                return details;
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, $"{errorMessage}: {ex.Message}");
            }
            
            return new ConferenceDetailsResponse();
        }

        public async Task<ConferenceDetailsResponse> GetConferenceDetailsByHearingId(Guid hearingId)
        {
            return await _videoApiClient.GetConferenceByHearingRefIdAsync(hearingId, false);
        }
    }
}
