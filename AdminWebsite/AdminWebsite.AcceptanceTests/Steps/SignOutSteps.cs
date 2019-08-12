using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class SignOutSteps
    {
        private readonly SignOut _signOut;

        public SignOutSteps(SignOut signOut)
        {
            _signOut = signOut;
        }

        [When(@"user attempts to sign out of Vh-Admin website")]
        public void WhenUserSignsOutOfVh_AdminWebsite()
        {
            _signOut.SignOutButton();
        }

        [Then(@"warning message should be displayed as (.*)")]
        public void ThenWarningMessageShouldBeDisplayedAs(string warningMessage)
        {
            _signOut.WarningMessage().Should().Be(warningMessage);
            var bookingPage = _signOut.GetItems("BookingPage");
            if (bookingPage == Breadcrumbs.HearingDetails || bookingPage == Breadcrumbs.HearingSchedule || bookingPage == Breadcrumbs.AssignJudge || bookingPage == Breadcrumbs.AddParticipants || bookingPage == Breadcrumbs.OtherInformation || bookingPage == Breadcrumbs.Summary)            
                _signOut.PopupSignOutButton();                       
        }
    }
}
