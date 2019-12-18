using AdminWebsite.Models;
using AdminWebsite.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;

namespace AdminWebsite.Controllers
{
    /// <summary>
    /// Responsible for retrieving reference data when requesting a booking.
    /// </summary>
    [Produces("application/json")]
    [Route("api/checklists")]
    [ApiController]
    public class ChecklistsController : ControllerBase
    {
        private readonly IUserIdentity _userIdentity;

        /// <summary>
        /// Instantiate the controller
        /// </summary>
        public ChecklistsController(IUserIdentity userIdentity)
        {
            _userIdentity = userIdentity;
        }

        /// <summary>
        /// Gets list of all submitted participant checklists including participant and hearing details.
        /// Ordered by checklist submission date, most recent checklist first.
        /// </summary>
        /// <param name="pageSize">Maximum number of items to retrieve in the page, maximum allowed 1000.</param>
        /// <param name="page">One-based index of page to retrieve.</param>
        /// <returns>The list of the participants questionnaire answers.</returns>
        [HttpGet]
        [SwaggerOperation(OperationId = "GetAllParticipantsChecklists")]
        [ProducesResponseType(typeof(ChecklistsResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> GetAllParticipantsChecklists(int pageSize = 5, int page = 1)
        {
            if (!_userIdentity.IsVhOfficerAdministratorRole())
                return Unauthorized();

            var response = new ChecklistsResponse
            {
                Checklists = new List<HearingParticipantCheckListResponse>
                {
                    new HearingParticipantCheckListResponse
                    {
                        Completed_date = DateTime.Now.AddDays(-1),
                        First_name = "Captain",
                        Last_name = "America",
                        Hearing_id = 1,
                        Landline = "+12321321",
                        Mobile = "12321312",
                        Participant_id = 1,
                        Question_answer_responses = new List<QuestionAnswerResponse>
                        {
                            new QuestionAnswerResponse
                            {
                                Answer = "Laptop",
                                Created_at = DateTime.Now.AddDays(-1),
                                Notes = null,
                                Question_key = "EQUIPMENT_DEVICE"
                            }
                        },
                        Role = "Professional",
                        Title = "Mr"
                    }
                },
                Current_page = 0,
                Hearings = new List<ChecklistsHearingResponse>
                {
                    new ChecklistsHearingResponse
                    {
                        Cases = new List<CaseResponse>
                        {
                            new CaseResponse
                            {
                                Name = "IronMan vs Captain America",
                                Number = "CDX2w312321"
                            }
                        },
                        Hearing_id = 1,
                        Scheduled_date_time = DateTime.Now.AddDays(3),
                        Status = "Booked"
                    }
                },
                Next_page_url = null,
                Prev_page_url = null,
                Total_pages = 1,
                Page_size = pageSize
            };
            return await Task.FromResult(Ok(response));
        }
    }
}