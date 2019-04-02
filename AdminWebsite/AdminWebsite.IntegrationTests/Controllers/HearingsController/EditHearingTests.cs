using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using Testing.Common;

namespace AdminWebsite.IntegrationTests.Controllers.HearingsController
{
    public class EditHearingTests : ControllerTestsBase
    {
        [Test]
        public async Task Test()
        {
            HearingDetailsResponse detailResponse = new HearingDetailsResponse();
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(detailResponse);

            var request = new EditHearingRequest
            {
                Case = new EditCaseRequest
                {
                    Name = "updated"
                },
                Participants = new List<EditParticipantRequest>
                {
                    new EditParticipantRequest
                    {
                        FirstName = "Automation01",
                        LastName = "Professional01",
                        CaseRoleName = "Litigant in Person"
                    }
                }
            };

            
            var jsonBody = ApiRequestHelper.SerialiseRequestToSnakeCaseJson(request);
            var httpContent = new StringContent(jsonBody, Encoding.UTF8, "application/json");
            var response = await SendPutRequestAsync($"/api/hearings/{Guid.NewGuid()}", httpContent);
            response.StatusCode.Should().Be(200);
            var resultJson = await response.Content.ReadAsStringAsync();
            var resultHearing = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(resultJson);

            resultHearing.Cases[0].Name.Should().Be(request.Case.Name);
        }
    }
}