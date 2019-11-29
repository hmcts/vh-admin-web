using System;
using AcceptanceTests.Model;
using AcceptanceTests.Model.Context;
using AcceptanceTests.Model.Type;
using AcceptanceTests.PageObject.Pages;
using AcceptanceTests.Tests.SpecflowTests.Common;
using AcceptanceTests.Tests.SpecflowTests.Common.Steps;
using Coypu;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.NuGet.Steps
{
    [Binding]
    public class ErrorSteps : StepsBase
    {

        public ErrorSteps(AppContextManager appContextManager, ScenarioContext scenarioContext, ITestContext testContext,
                            BrowserSession driver) : base(appContextManager, scenarioContext, testContext, driver)
        {
        }

        [Then(@"I see a page with the '(.*)' message and the content below:")]
        public void ThenErrorMessageIsDisplayedAsYouAreNotAuthorisedToUseThisService(string messageType, string pageContent)
        {
            var parsedMessageType = EnumParser.ParseText<MessageType>(messageType);

            switch (parsedMessageType)
            {
                case MessageType.Unauthorised:
                    new UnauthorisedErrorPage(_driver).UnauthorisedText().Should().Be(pageContent);
                    break;
                default:
                    throw new NotSupportedException($"Message {messageType} is not currently supported");
            } 
        }

        [Then(@"I can follow the '(.*)' CTA on the screen")]
        public void ThenICanFollowTheCTAOnTheScreen(string ctaText)
        {
            _scenarioContext.Pending();
        }
    }
}
