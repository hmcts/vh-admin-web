using System.Collections.Generic;
using FluentAssertions;

namespace AdminWebsite.AcceptanceTests.Pages.Journeys
{
    public class GetAudioFileJourney : IJourney
    {
        public List<Page> Journey()
        {
            return new List<Page>()
            {
                Page.Login,
                Page.Dashboard,
                Page.GetAudioFile
            };
        }

        public void VerifyUserIsApplicableToJourney(string currentUserRole)
        {
            currentUserRole.ToLower().Should().BeOneOf("video hearings officer");
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
