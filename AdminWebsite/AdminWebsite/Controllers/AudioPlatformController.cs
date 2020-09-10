using System;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.VideoAPI.Client;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using HearingAudioRecordingResponse = AdminWebsite.Models.HearingAudioRecordingResponse;
using CvpForAudioFileResponse = AdminWebsite.Models.CvpForAudioFileResponse;
using System.Collections.Generic;
using System.Linq;

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

                return Ok(new HearingAudioRecordingResponse { AudioFileLink = response.Audio_file_link });
            }
            catch (VideoApiException ex)
            {
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        [HttpGet("{cloudroom}/{date}/{caseReference}")]
        [SwaggerOperation(OperationId = "GetCvpAudioRecordingLinkWithCaseReference")]
        [ProducesResponseType(typeof(List<CvpForAudioFileResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> GetCvpAudioRecordingLinkWithCaseReferenceAsync(string cloudroom, string date, string caseReference)
        {
            _logger.LogInformation($"Getting CVP audio recording for cloudroom: {cloudroom}, date: {date}, case reference: {caseReference}");

            try
            {
                var cvpFilesResponse = await _videoAPiClient.GetAudioRecordingLinkCvpWithCaseReferenceAsync(cloudroom, date, caseReference);

                var response = cvpFilesResponse.Select(x => new CvpForAudioFileResponse { FileName = x.File_name, SasTokenUri = x.Sas_token_url })
                    .ToList();

                return Ok(response);
            }
            catch (VideoApiException ex)
            {
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        [HttpGet("{cloudroom}/{date}")]
        [SwaggerOperation(OperationId = "GetCvpAudioRecordingLink")]
        [ProducesResponseType(typeof(List<CvpForAudioFileResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> GetCvpAudioRecordingLinkAsync(string cloudroom, string date)
        {
            _logger.LogInformation($"Getting CVP audio recording for cloudroom: {cloudroom}, date: {date}");

            try
            {
                var cvpFilesResponse = await _videoAPiClient.GetAudioRecordingLinkCvpAsync(cloudroom, date);

                var response = cvpFilesResponse.Select(x => new CvpForAudioFileResponse { FileName = x.File_name, SasTokenUri = x.Sas_token_url })
                    .ToList();

                return Ok(response);
            }
            catch (VideoApiException ex)
            {
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }
    }
}