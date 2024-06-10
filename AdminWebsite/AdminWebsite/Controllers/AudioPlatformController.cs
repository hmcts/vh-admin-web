using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using BookingsApi.Client;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using CvpForAudioFileResponse = AdminWebsite.Models.CvpForAudioFileResponse;
using HearingAudioRecordingResponse = AdminWebsite.Models.HearingAudioRecordingResponse;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/audio")]
    [ApiController]
    public class AudioPlatformController : ControllerBase
    {
        private readonly IVideoApiClient _videoAPiClient;
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly ILogger<AudioPlatformController> _logger;

        public AudioPlatformController(IVideoApiClient videoAPiClient, ILogger<AudioPlatformController> logger, IBookingsApiClient bookingsApiClient)
        {
            _videoAPiClient = videoAPiClient;
            _logger = logger;
            _bookingsApiClient = bookingsApiClient;
        }

        /// <summary>
        /// Get the audio recording for a given hearing.
        /// </summary>
        /// <param name="hearingId">The hearing id.</param>
        /// <returns> The hearing</returns>
        [HttpGet("{hearingId}")]
        [SwaggerOperation(OperationId = "GetAudioRecordingLink")]
        [ProducesResponseType(typeof(HearingAudioRecordingResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> GetAudioRecordingLinkAsync(Guid hearingId)
        {
            _logger.LogInformation("Getting audio recording for hearing: {HearingId}", hearingId);

            try
            {
                var requestKey = "";
                requestKey = await GetAudioHrsFileName(hearingId);
                
                var response = await _videoAPiClient.GetAudioRecordingLinkAsync(requestKey);
                return Ok(new HearingAudioRecordingResponse { AudioFileLinks = response.AudioFileLinks });

            }
            catch (VideoApiException ex)
            {
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        [HttpGet("cvp/all/{cloudroom}/{date}/{caseReference}")]
        [SwaggerOperation(OperationId = "GetCvpAudioRecordingsAll")]
        [ProducesResponseType(typeof(List<CvpForAudioFileResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.GatewayTimeout)]
        public async Task<IActionResult> GetCvpAudioRecordingsALlLinkAsync(string cloudroom, string date, string caseReference)
        {
            try
            {
                var cvpFilesResponse = await _videoAPiClient.GetAudioRecordingLinkAllCvpAsync(cloudroom, date, caseReference);

                return Ok(GetCvpForAudioFileResponses(cvpFilesResponse));
            }
            catch (VideoApiException ex)
            {
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        [HttpGet("cvp/cloudroom/{cloudroom}/{date}")]
        [SwaggerOperation(OperationId = "GetCvpAudioRecordingsByCloudRoom")]
        [ProducesResponseType(typeof(List<CvpForAudioFileResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.GatewayTimeout)]
        public async Task<IActionResult> GetCvpAudioRecordingsByCloudRoomAsync(string cloudroom, string date)
        {
            try
            {
                var cvpFilesResponse = await _videoAPiClient.GetAudioRecordingLinkCvpByCloudRoomAsync(cloudroom, date);

                return Ok(GetCvpForAudioFileResponses(cvpFilesResponse));
            }
            catch (VideoApiException ex)
            {
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        [HttpGet("cvp/date/{date}/{caseReference}")]
        [SwaggerOperation(OperationId = "GetCvpAudioRecordingsByDate")]
        [ProducesResponseType(typeof(List<CvpForAudioFileResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.GatewayTimeout)]
        public async Task<IActionResult> GetCvpAudioRecordingsByDateAsync(string date, string caseReference)
        {
            try
            {
                var cvpFilesResponse = await _videoAPiClient.GetAudioRecordingLinkCvpByDateAsync(date, caseReference);

                return Ok(GetCvpForAudioFileResponses(cvpFilesResponse));
            }
            catch (VideoApiException ex)
            {
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        private static List<CvpForAudioFileResponse> GetCvpForAudioFileResponses(IEnumerable<CvpAudioFileResponse> cvpFilesResponse)
        {
            var response = cvpFilesResponse
                .Select(x => new CvpForAudioFileResponse {FileName = x.FileName, SasTokenUri = x.SasTokenUrl})
                .ToList();
            
            return response;
        }
        
        private async Task<string> GetAudioHrsFileName(Guid hearingId)
        {
            var hearing = await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId);
            
            string serviceId = hearing.ServiceId;
            string caseNumber = hearing.Cases[0].Number;
            string hearingIdString = hearingId.ToString();
            
            const string regex = "[^a-zA-Z0-9]";
            const RegexOptions regexOptions = RegexOptions.None;
            var timeout = TimeSpan.FromMilliseconds(500);

            var sanitisedServiceId = Regex.Replace(serviceId, regex, "", regexOptions, timeout);
            var sanitisedCaseNumber = Regex.Replace(caseNumber, regex, "", regexOptions, timeout);
            
            return $"{sanitisedServiceId}-{sanitisedCaseNumber}-{hearingIdString}";
        }
    }
}