using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using AdminWebsite.AcceptanceTests.Builders;
using AdminWebsite.AcceptanceTests.Configuration;
using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.BookingsAPI.Client;
using FluentAssertions;
using Testing.Common;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public class DataSetupHelper
    {
        public PersonResponse GetPersonByUsername(TestContext context, string username, PersonEndpoints endpoints)
        {
            context.Request = context.Get(endpoints.GetPersonByUsername(username));
            context.Response = context.BookingsApiClient().Execute(context.Request);
            var person =
                ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<PersonResponse>(context.Response
                    .Content);

            return person;
        }

        public IEnumerable<UserAccount> GetParticipantsNotInTheDb(TestContext testContext)
        {
            var endpoints = new PersonEndpoints();
            List<UserAccount> participantsToAddToDb = new List<UserAccount>();

            foreach (var user in testContext.UserAccounts)
            {
                if (user.Role.Equals("individual", StringComparison.OrdinalIgnoreCase)
                    || user.Role.Equals("representative", StringComparison.OrdinalIgnoreCase))
                {
                    if (GetPersonByUsername(testContext, user.Username, endpoints) == null)
                    {
                        participantsToAddToDb.Add(user);
                    }
                }
            }

            return participantsToAddToDb;
        }

        public void CreateNewHearingRequest(TestContext testContext, HearingsEndpoints endpoints)
        {
            var requestBody = new HearingRequestBuilder().WithContext(testContext).Build();
            testContext.Request = testContext.Post(endpoints.BookNewHearing(), requestBody);
            testContext.Response = testContext.BookingsApiClient().Execute(testContext.Request);
            testContext.Response.StatusCode.Should().Be(HttpStatusCode.Created);

            var model = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(testContext.Response.Content);
            testContext.HearingId = (Guid)model.Id;
            var individual = model.Participants.First(p => p.Username.StartsWith(testContext.GetIndividualUser().Username));
            testContext.GetIndividualUser().Id = (Guid)individual.Id;
            var representative = model.Participants.First(p => p.Username.StartsWith(testContext.GetRepresentativeUser().Username));
            testContext.GetRepresentativeUser().Id = (Guid)representative.Id;
        }

        public void ClearHearings(TestContext context, HearingsEndpoints endpoints, IEnumerable<UserAccount> users)
        {
            foreach (var user in users)
            {
                context.Request = context.Get(endpoints.GetHearingsByUsername(user.Username));
                context.Response = context.BookingsApiClient().Execute(context.Request);
                var hearings =
                    ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<List<HearingDetailsResponse>>(context.Response
                        .Content);
                RemoveHearings(context, endpoints, hearings);
            }
        }

        public void RemoveHearings(TestContext context, HearingsEndpoints endpoints, IEnumerable<HearingDetailsResponse> hearingsList)
        {
            foreach (var hearing in hearingsList)
            {
                context.Request = context.Delete(endpoints.RemoveHearing(hearing.Id));
                context.Response = context.BookingsApiClient().Execute(context.Request);
                context.Response.IsSuccessful.Should().BeTrue("Test hearings should have been deleted");
            }
        }


        public void RemoveHearing(TestContext context, HearingsEndpoints endpoints, IEnumerable<HearingDetailsResponse> hearingsList)
        {
            if (context.HearingId == Guid.Empty) return;
            context.Request = context.Delete(endpoints.RemoveHearing(context.HearingId));
            context.Response = context.BookingsApiClient().Execute(context.Request);
            context.Response.IsSuccessful.Should().BeTrue("New hearing has been deleted after the test");
            context.HearingId = Guid.Empty;
        }
    }
}
