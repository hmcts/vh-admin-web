using AdminWebsite.Extensions;
using FluentAssertions;
using NUnit.Framework;
using UserApi.Contract.Responses;


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
            var userProfile = new UserProfile { UserRole = " " };

            var result = userProfile.HasValidUserRole();

            result.Should().BeFalse();
        }

        [Test]
        public void Should_return_true_when_userrole_is_none()
        {
            var userProfile = new UserProfile { UserRole = "None" };

            var result = userProfile.HasValidUserRole();

            result.Should().BeFalse();
        }

        [Test]
        public void Should_return_true_when_userrole_is_not_valid()
        {
            var userProfile = new UserProfile { UserRole = "NotMatchingType" };

            var result = userProfile.HasValidUserRole();

            result.Should().BeFalse();
        }

        [Test]
        public void Should_return_true_when_userrole_is_valid()
        {
            var userProfile = new UserProfile { UserRole = "Judge" };

            var result = userProfile.HasValidUserRole();

            result.Should().BeTrue();
        }
    }
}
