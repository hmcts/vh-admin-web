using AdminWebsite.Controllers;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.Configuration;
using FluentAssertions;
using NUnit.Framework;
using System.Threading.Tasks;

namespace AdminWebsite.UnitTests.Controllers
{

    public class FeatureControllerTests
    {
        private AutoMock _mocker;

        [Test]
        public async Task GetFeatureToggles_Should_Return_All_Feature_Toggles()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IBookingsApiClient>().Setup(p => p.GetFeatureTogglesAsync()).Returns(Task.FromResult(new FeatureToggleConfiguration()
            {
                StaffMemberFeature = true,
                EJudFeature = false
            }));

            var _controller = _mocker.Create<FeatureController>();
            var result = await _controller.GetFeatureToggles();

            result.Value.StaffMemberFeature.Should().BeTrue();
            result.Value.EJudFeature.Should().BeFalse();
        }
    }
}
