﻿using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using AdminWebsite.Mappers;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Responses;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/judiciary")]
    [ApiController]
    public class JudiciaryAccountsController : ControllerBase
    {
        private readonly IUserAccountService _userAccountService;
        private readonly JavaScriptEncoder _encoder;
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly IFeatureToggles _featureToggles;
        private readonly TestUserSecrets _testSettings;

        public JudiciaryAccountsController(IUserAccountService userAccountService, JavaScriptEncoder encoder,
            IBookingsApiClient bookingsApiClient, IOptions<TestUserSecrets> testSettings, IFeatureToggles featureToggles)
        {
            _userAccountService = userAccountService;
            _encoder = encoder;
            _bookingsApiClient = bookingsApiClient;
            _featureToggles = featureToggles;
            _testSettings = testSettings.Value;
        }
        
        /// <summary>
        /// Find judges and court rooms accounts list by email search term.
        /// </summary>
        /// <param name = "term" > The email address search term.</param>
        /// <returns> The list of judges</returns>
        [HttpPost("judges", Name = "PostJudgesBySearchTerm")]
        [SwaggerOperation(OperationId = "PostJudgesBySearchTerm")]
        [ProducesResponseType(typeof(List<JudgeResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<IList<JudgeResponse>>> PostJudgesBySearchTermAsync([FromBody] string term)
        {
            // This is the v1 ejud search for judges
            try
            {
                term = _encoder.Encode(term);
                var searchTerm = new SearchTermRequest(term);
                List<JudgeResponse> allJudges;
                var courtRoomJudgesTask = _userAccountService.SearchJudgesByEmail(searchTerm.Term);
                var courtRoomJudges = await courtRoomJudgesTask;
                allJudges = courtRoomJudges
                    .OrderBy(x => x.Email)
                    .Take(20)
                    .ToList();
                
                return Ok(allJudges);
           
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }

                throw;
            }
        }

        /// <summary>
        /// Find judiciary person list by email search term.
        /// </summary>
        /// <param name = "term" > The email address search term.</param>
        /// <returns> The list of judiciary person</returns>
        [HttpPost(Name = "PostJudiciaryPersonBySearchTerm")]
        [SwaggerOperation(OperationId = "PostJudiciaryPersonBySearchTerm")]
        [ProducesResponseType(typeof(List<PersonResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<IList<PersonResponse>>> PostJudiciaryPersonBySearchTermAsync([FromBody] string term)
        {
            // This is the v1 ejud search for panel members and wingers
            
            try
            {
                term = _encoder.Encode(term);
                var searchTerm = new SearchTermRequest(term);
                var courtRoomJudgesTask = _userAccountService.SearchEjudiciaryJudgesByEmailUserResponse(searchTerm.Term);
                var eJudiciaryJudgesTask = GetEjudiciaryJudgesBySearchTermAsync(searchTerm);
        
                await Task.WhenAll(courtRoomJudgesTask, eJudiciaryJudgesTask);
        
                var eJudiciaryJudges = (await eJudiciaryJudgesTask)
                    .Where(p => !p.Email.Contains(_testSettings.TestUsernameStem))
                    .Select(p => p.MapToPersonResponse())
                    .ToList();
                var courtRoomJudges = (await courtRoomJudgesTask)
                    .Where(x => !eJudiciaryJudges.Select(e => e.Username).Contains(x.ContactEmail))
                    .Select(UserResponseMapper.MapFrom);
                
                var allJudges = courtRoomJudges.Concat(eJudiciaryJudges)
                    .OrderBy(x => x.ContactEmail).Take(20).ToList();
                return Ok(allJudges);
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }
                throw;
            }
        }

        /// <summary>
        /// Find judiciary person list by email search term.
        /// </summary>
        /// <param name = "term" > The email address search term.</param>
        /// <returns> The list of judiciary person</returns>
        [HttpPost("search",Name = "SearchForJudiciaryPerson")]
        [SwaggerOperation(OperationId = "SearchForJudiciaryPerson")]
        [ProducesResponseType(typeof(List<JudiciaryPerson>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<List<JudiciaryPerson>>> SearchForJudiciaryPersonAsync([FromBody] string term)
        {
            // This is the v2 search for judicial office holders
            
            try
            {
                term = _encoder.Encode(term);
                var searchTerm = new SearchTermRequest(term);
                
                var eJudiciaryJudges = (await _bookingsApiClient.PostJudiciaryPersonBySearchTermAsync(searchTerm)).ToList();
                var allJudges = eJudiciaryJudges.OrderBy(x => x.Email).ToList();
                var mapped = allJudges.Select(x => x.MapToAdminWebResponse()).ToList();
                return Ok(mapped);
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }

                throw;
            }
        }

        private async Task<List<JudiciaryPersonResponse>> GetEjudiciaryJudgesBySearchTermAsync(SearchTermRequest term)
        {
            return (await _bookingsApiClient.PostJudiciaryPersonBySearchTermAsync(term)).ToList();
        }
    }
}
