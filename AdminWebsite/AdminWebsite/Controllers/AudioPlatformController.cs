using AdminWebsite.VideoAPI.Client;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
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
        private readonly ILogger<AudioPlatformController> _logger;

        public AudioPlatformController(IVideoApiClient videoAPiClient, ILogger<AudioPlatformController> logger)
        {
            _videoAPiClient = videoAPiClient;
            _logger = logger;
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
            _logger.LogInformation($"Getting audio recording for hearing: {hearingId}");

            try
            {
                var response = await _videoAPiClient.GetAudioRecordingLinkAsync(hearingId);
                return Ok(new HearingAudioRecordingResponse { AudioFileLinks = response.Audio_file_links });

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
        public async Task<IActionResult> GetCvpAudioRecordingsALlLinkAsync(string cloudroom, string date, string caseReference)
        {
            _logger.LogInformation($"GetCvpAudioRecordingsALlLinkAsync cloudroom: {cloudroom}, date: {date}, case reference: {caseReference}");

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
        public async Task<IActionResult> GetCvpAudioRecordingsByCloudRoomAsync(string cloudroom, string date)
        {
            _logger.LogInformation($"GetCvpAudioRecordingsByCloudRoomAsync cloudroom: {cloudroom}, date: {date}");

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
        public async Task<IActionResult> GetCvpAudioRecordingsByDateAsync(string date, string caseReference)
        {
            _logger.LogInformation($"GetCvpAudioRecordingsByDateAsync Date: {date}, case reference: {caseReference}");

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

        private static List<CvpForAudioFileResponse> GetCvpForAudioFileResponses(List<CvpAudioFileResponse> cvpFilesResponse)
        {
            var response = cvpFilesResponse
                .Select(x => new CvpForAudioFileResponse {FileName = x.File_name, SasTokenUri = x.Sas_token_url})
                .ToList();
            
            return response;
        }
    }
}