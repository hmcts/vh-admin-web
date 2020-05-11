using System;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.VideoAPI.Client;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
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
        [ProducesResponseType(typeof(HearingAudioRecordingResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
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
    }
}