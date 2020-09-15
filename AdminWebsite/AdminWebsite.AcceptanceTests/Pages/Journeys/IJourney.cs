using System.Collections.Generic;
using AdminWebsite.TestAPI.Client;

namespace AdminWebsite.AcceptanceTests.Pages.Journeys
{
    public interface IJourney
    {
        List<Page> Journey();
        void VerifyDestinationIsInThatJourney(Page destinationPage);
        void VerifyUserIsApplicableToJourney(UserType userType);
        Page GetNextPage(Page currentPage);
    }
}
