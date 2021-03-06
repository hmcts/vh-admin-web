﻿using System.Linq;
using System.Net;
using AdminWebsite.AcceptanceTests.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using TestApi.Contract.Enums;
using TestApi.Contract.Requests;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public class UnallocateUsersHooks
    {
        [AfterScenario]
        public void UnallocateUsers(TestContext context)
        {
            if (context?.Api == null) return;
            if (context.Users == null) return;

            var usernames = context.Users.Where(user => user.UserType != UserType.Judge).Select(user => user.Username).ToList();
            if (usernames.Count <= 0) return;

            var request = new UnallocateUsersRequest()
            {
                Usernames = usernames
            };

            var response = context.Api.UnallocateUsers(request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}
