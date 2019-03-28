using AdminWebsite.BookingsAPI.Client;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Testing.Common;

namespace AdminWebsite.IntegrationTests.Controllers
{
    public class HearingsControllerTests : ControllerTestsBase
    {
        private readonly HearingEndpoints _hearingEndpoints = new ApiUriFactory().HearingEndpoints;

        [Test]
        public async Task should_create_a_hearing_given_a_valid_booking_request()
        {
            BookNewHearingRequest bookNewHearingRequest = new BookNewHearingRequest()
            {
                Cases = new List<CaseRequest>() { new CaseRequest() { Name = "BBC vs ITV", Number = "TX/12345/2019", Is_lead_case = false } },
                Case_type_name = "Civil Money Claims",
                Hearing_room_name = "Room 6.41D",
                Hearing_type_name = "Application to Set Judgment Aside",
                Hearing_venue_name = "Manchester Civil and Family Justice Centre",
                Other_information = "Any other information about the hearing",
                Participants = new List<ParticipantRequest>()
                {
                    new ParticipantRequest() { Case_role_name = "Judge", Contact_email = "Judge.Lumb@hearings.reform.hmcts.net", Display_name = "Judge Lumb", First_name = "Judge", Hearing_role_name = "Judge", Last_name = "Lumb", Middle_names = string.Empty, Representee = string.Empty, Solicitors_reference = string.Empty, Telephone_number = string.Empty, Title = "Judge", Username = "Judge.Lumb@hearings.reform.hmcts.net" },
                    new ParticipantRequest() { Case_role_name = "Claimant", Contact_email = "test.claimaint@emailaddress.net", Display_name = "Test Claimaint", First_name = "Test", Hearing_role_name = "Claimant LIP", Last_name = "Claimaint", Middle_names = string.Empty, Representee = string.Empty, Solicitors_reference = string.Empty, Telephone_number = string.Empty, Title = "Mr", Username = "Test.Claimaint@hearings.reform.hmcts.net" },
                    new ParticipantRequest() { Case_role_name = "Defendant", Contact_email = "test.defendant@emailaddress.net", Display_name = "Test Defendant", First_name = "Test", Hearing_role_name = "Solicitor", Last_name = "Defendant", Middle_names = string.Empty, Representee = string.Empty, Solicitors_reference = string.Empty, Telephone_number = string.Empty, Title = "Mr", Username = "Test.Defendant@hearings.reform.hmcts.net" },
                },
                Scheduled_date_time = DateTime.Now,
                Scheduled_duration = 45
            };

            var bookHearingHttpRequest = new StringContent(
                ApiRequestHelper.SerialiseRequestToSnakeCaseJson(bookNewHearingRequest),
                Encoding.UTF8, "application/json");

            var hearingDetailsResponse =
                await SendPostRequestAsync(_hearingEndpoints.BookNewHearing, bookHearingHttpRequest);

            hearingDetailsResponse.StatusCode.Should().Be(HttpStatusCode.Created);
            var hearingDetailsModel =
                ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(hearingDetailsResponse.Content
                    .ReadAsStringAsync().Result);
            TestContext.WriteLine($"Response:{ApiRequestHelper.SerialiseRequestToSnakeCaseJson(hearingDetailsModel)}");
            hearingDetailsModel.Should().NotBeNull();
        }
    }
}
