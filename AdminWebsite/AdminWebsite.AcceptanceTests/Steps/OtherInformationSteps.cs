using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class OtherInformationSteps
    {
        private readonly OtherInformation _otherInformation;

        public OtherInformationSteps(OtherInformation otherInformation)
        {
            _otherInformation = otherInformation;
        }
        [When(@"Admin user is on hmore information page")]
        public void MoreInformationPage()
        {
            _otherInformation.PageUrl(PageUri.OtherInformationPage);
        }
        [When(@"user adds other information to the Video Hearing booking")]
        public void WhenUserAddsOtherInformationToBookingHearing()
        {
            MoreInformationPage();
            _otherInformation.GetOtherInformationHeading().Should().Be(TestData.OtherInformation.OtherInformationText);
            _otherInformation.AddOtherInformation(TestData.OtherInformation.OtherInformationText);
        }
    }
}