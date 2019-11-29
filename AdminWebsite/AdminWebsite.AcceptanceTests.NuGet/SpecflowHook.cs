using System.IO;
using System.Reflection;
using AcceptanceTests.Tests.SpecflowTests.Common.Hooks;
using BoDi;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.NuGet
{
    [Binding]
    public class SpecflowHook
    {
        private IObjectContainer _objectContainer;
        private DriverHook _driverHook;
        private TestSetUpHook _testSetUpHook;

        public SpecflowHook(DriverHook driverHook, TestSetUpHook testSetUpHook, IObjectContainer objectContainer)
        {
            _objectContainer = objectContainer;
            _driverHook = driverHook;
            _testSetUpHook = testSetUpHook;
        }

        [BeforeScenario]
        public void SetUp()
        {
            var path = $"{Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)}";
            var testContext = _testSetUpHook.OneTimeSetup(path);
            var driver = _driverHook.SetUpDriver(testContext);
            _objectContainer.RegisterInstanceAs(driver);
        }

        [AfterScenario]
        public void TearDown()
        {
            _driverHook.TearDownSession();
        }
    }
}
