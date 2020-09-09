using System;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.VideoAPI.Client;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using HearingAudioRecordingResponse = AdminWebsite.Models.HearingAudioRecordingResponse;
using CvpAudioFileResponse = AdminWebsite.Models.CvpAudioFileResponse;
using System.Collections.Generic;

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

        [HttpGet]
        [SwaggerOperation(OperationId = "GetCvpAudioRecordingLink")]
        [ProducesResponseType(typeof(List<CvpAudioFileResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public IActionResult GetCvpAudioRecordingLinkAsync(string cloudroomName, DateTime hearingDate, string caseReference)
        {
            _logger.LogInformation($"Getting CVP audio recording for cloudroom: {cloudroomName}");

            try
            {
                var formatDate = $"{hearingDate.Year}-{AppendToDate(hearingDate.Month)}-{AppendToDate(hearingDate.Day)}";
                // var response = await _videoAPiClient.GetCvpAudioRecordingLinkAsync(cloudroomName, formatDate, caseReference);

                return Ok(new List<CvpAudioFileResponse> { new CvpAudioFileResponse
                { FileName = "FM-12345_08-09-2020_0.mp4", SasTokenUri = "www.zara.com"  },
                new CvpAudioFileResponse{ FileName = "FM-12345_08-09-2020_0.mp4", SasTokenUri = "www.zara.com"  },
                new CvpAudioFileResponse{ FileName = "FM-12345_08-09-2020_0.mp4", SasTokenUri = "www.zara.com"  }
                });
            }
            catch (VideoApiException ex)
            {
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        private string AppendToDate(int dateValue)
        {
            return dateValue > 9 ? dateValue.ToString() : $"0{dateValue}";
        }
    }
}