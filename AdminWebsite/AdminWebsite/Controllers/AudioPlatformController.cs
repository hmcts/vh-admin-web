using System;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/audio")]
    [ApiController]
    public class AudioPlatformController : ControllerBase
    {
        private readonly ILogger<AudioPlatformController> _logger;

        public AudioPlatformController(ILogger<AudioPlatformController> logger)
        {
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

            return await Task.FromResult(Ok(new HearingAudioRecordingResponse
            {
                AudioFileLink = "https://blobsotageFake.com/bisd76sdfhvf7ashagid6jkfdf6sfjk"
            }));
        }
    }
}