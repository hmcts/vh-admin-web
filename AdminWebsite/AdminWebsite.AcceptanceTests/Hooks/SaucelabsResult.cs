using OpenQA.Selenium;
using System;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class SaucelabsResult
    {
        public static void LogPassed(bool passed, IWebDriver driver)
        {
            try
            {
                ((IJavaScriptExecutor)driver).ExecuteScript("sauce:job-result=" + (passed ? "passed" : "failed"));
            }
            catch (Exception e)
            {
                Console.WriteLine($"<{e.GetType().Name}> Failed to report test status to saucelabs: {e.Message}");
            }
        }
    }
}