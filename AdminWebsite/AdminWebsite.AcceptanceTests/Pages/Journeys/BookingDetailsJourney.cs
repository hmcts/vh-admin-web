using System.Collections.Generic;
using FluentAssertions;

namespace AdminWebsite.AcceptanceTests.Pages.Journeys
{
    public class BookingDetailsJourney : IJourney
    {
        public List<Page> Journey()
        {
            return new List<Page>()
                {
                    Page.Login,
                    Page.Dashboard,
                    Page.HearingDetails,
                    Page.HearingSchedule,
                    Page.AssignJudge,
                    Page.AddParticipants,
                    Page.OtherInformation,
                    Page.Summary,
                    Page.BookingConfirmation,
                    Page.BookingDetails
                };
        }

        public void VerifyUserIsApplicableToJourney(string currentUserRole)
        {
            currentUserRole.ToLower().Should().BeOneOf("video hearings officer", "case admin");
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
