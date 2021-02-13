using AdminWebsite.Models;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Attributes
{
    public class HearingRoleComparisonTests
    {
        private readonly HearingRole _roleBeginningWithA = new HearingRole("Aardvark", "Aardvark");
        private readonly HearingRole _sameRoleBeginningWithA = new HearingRole("Aardvark", "Aardvark");
        private readonly HearingRole _roleBeginningWithZ = new HearingRole("Zebra", "Zebra");

        [Test]
        public void Should_compare_and_be_equal()
        {
            _roleBeginningWithA.Equals(_sameRoleBeginningWithA).Should().BeTrue();
        }

        [Test]
        public void Should_compare_null()
        {
            _roleBeginningWithA.CompareTo(null).Should().Be(1);
        }

        [Test]
        public void Should_compare_empty_object()
        {
            _roleBeginningWithA.CompareTo(new object()).Should().Be(0);
        }

        [Test]
        public void Should_compare_and_be_lower_in_the_order()
        {
            _roleBeginningWithA.CompareTo(_roleBeginningWithZ).Should().BeNegative();
        }

        [Test]
        public void Should_compare_and_be_higher_in_the_order()
        {
            _roleBeginningWithZ.CompareTo(_roleBeginningWithA).Should().BePositive();
        }

        [Test]
        public void Should_equals_and_not_be_the_same()
        {
            _roleBeginningWithA.Equals(_roleBeginningWithZ).Should().BeFalse();
        }

        [Test]
        public void Should_equals_and_not_be_the_same_for_a_different_object()
        {
            _roleBeginningWithA.Equals(new object()).Should().BeFalse();
        }

        [Test]
        public void Should_compare_and_be_the_same()
        {
            _roleBeginningWithA.CompareTo(_sameRoleBeginningWithA).Should().Be(0);
        }

        [Test]
        public void Should_compare_equals_operator()
        {
            (_roleBeginningWithA == _sameRoleBeginningWithA).Should().Be(true);
        }

        [Test]
        public void Should_compare_less_than_true()
        {
            (_roleBeginningWithA < _roleBeginningWithZ).Should().Be(true);
        }

        [Test]
        public void Should_compare_less_than_false()
        {
            (_roleBeginningWithZ < _roleBeginningWithA).Should().Be(false);
        }

        [Test]
        public void Should_compare_less_than_null()
        {
            (null < _roleBeginningWithA).Should().Be(false);
        }

        [Test]
        public void Should_compare_less_than_or_equals_true()
        {
            (_roleBeginningWithA <= _roleBeginningWithZ).Should().Be(true);
        }

        [Test]
        public void Should_compare_less_than_or_equals_false()
        {
            (_roleBeginningWithZ <= _roleBeginningWithA).Should().Be(false);
        }

        [Test]
        public void Should_compare_greater_than_true()
        {
            (_roleBeginningWithZ > _roleBeginningWithA).Should().Be(true);
        }

        [Test]
        public void Should_compare_greater_than_false()
        {
            (_roleBeginningWithA > _roleBeginningWithZ).Should().Be(false);
        }

        [Test]
        public void Should_compare_greater_than_null()
        {
            (null > _roleBeginningWithA).Should().Be(false);
        }

        [Test]
        public void Should_compare_greater_than_or_equals_true()
        {
            (_roleBeginningWithZ >= _roleBeginningWithA).Should().Be(true);
        }

        [Test]
        public void Should_compare_greater_than_or_equals_false()
        {
            (_roleBeginningWithA >= _roleBeginningWithZ).Should().Be(false);
        }

        [Test]
        public void Should_compare_not_equal_to_false()
        {
            (_roleBeginningWithA != _sameRoleBeginningWithA).Should().Be(false);
        }

        [Test]
        public void Should_compare_not_equal_to_true()
        {
            (_roleBeginningWithA != _roleBeginningWithZ).Should().Be(true);
        }

        [Test]
        public void Should_get_hash_code()
        {
            _roleBeginningWithA.GetHashCode().Should().BeInRange(int.MinValue, int.MaxValue);
        }
    }
}
