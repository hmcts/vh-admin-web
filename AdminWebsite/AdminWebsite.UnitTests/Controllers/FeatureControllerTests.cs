using AdminWebsite.Configuration;
using AdminWebsite.Controllers;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.Extensions.Options;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers
{

    public class FeatureControllerTests
    {
        private AutoMock _mocker;

        [Test]
        public void GetFeatureToggles_Should_Return_All_Feature_Toggles()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IOptions<FeatureToggleConfiguration>>().Setup(opt => opt.Value).Returns(new FeatureToggleConfiguration()
            {
                StaffMember = true
            });

            var _controller = _mocker.Create<FeatureController>();
            var result = _controller.GetFeatureToggles();

            result.Value.StaffMember.Should().Be(true);
        }
    }
}
