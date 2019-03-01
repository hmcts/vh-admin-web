using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
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
        [When(@"admin adds more information")]
        public void AdminAddsMoreInformation()
        {
            _otherInformation.ClickBreadcrumb("Other information");
            MoreInformationPage();
        }
        [When(@"Admin user is on hmore information page")]
        public void MoreInformationPage()
        {
            _otherInformation.PageUrl(PageUri.OtherInformationPage);
        }
    }
}