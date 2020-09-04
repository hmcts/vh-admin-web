using System.Collections.Generic;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;

namespace AdminWebsite.AcceptanceTests.Pages.Journeys
{
    public class ChangePasswordJourney : IJourney
    {
        public List<Page> Journey()
        {
            return new List<Page>()
            {
                Page.Login,
                Page.Dashboard,
                Page.ChangePassword
            };
        }

        public void VerifyUserIsApplicableToJourney(UserType userType)
        {
            userType.Should().Be(UserType.VideoHearingsOfficer);
        }

        public void VerifyDestinationIsInThatJourney(Page destinationPage)
        {
            Journey().Should().Contain(destinationPage);
        }

        public Page GetNextPage(Page currentPage)
        {
            return Journey()[Journey().IndexOf(currentPage) + 1];
        }
    }
}
