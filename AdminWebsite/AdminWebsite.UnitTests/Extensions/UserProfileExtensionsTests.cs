using AdminWebsite.Extensions;
using AdminWebsite.UserAPI.Client;
using FluentAssertions;
using NUnit.Framework;


namespace AdminWebsite.UnitTests.Extensions
{
    public class UserProfileExtensionsTests
    {
        [Test]
        public void Should_return_true_when_userrole_is_null()
        {
            var userProfile = new UserProfile();

            var result = userProfile.HasValidUserRole();

            result.Should().BeFalse();
        }

        [Test]
        public void Should_return_true_when_userrole_is_empty()
        {
            var userProfile = new UserProfile { User_role = " " };

            var result = userProfile.HasValidUserRole();

            result.Should().BeFalse();
        }

        [Test]
        public void Should_return_true_when_userrole_is_none()
        {
            var userProfile = new UserProfile { User_role = "None" };

            var result = userProfile.HasValidUserRole();

            result.Should().BeFalse();
        }

        [Test]
        public void Should_return_true_when_userrole_is_not_valid()
        {
            var userProfile = new UserProfile { User_role = "NotMatchingType" };

            var result = userProfile.HasValidUserRole();

            result.Should().BeFalse();
        }

        [Test]
        public void Should_return_true_when_userrole_is_valid()
        {
            var userProfile = new UserProfile { User_role = "Judge" };

            var result = userProfile.HasValidUserRole();

            result.Should().BeTrue();
        }
    }
}
