using AdminWebsite.Contracts.Responses;
using FluentAssertions;
using NUnit.Framework;
using System;

namespace AdminWebsite.UnitTests.Contracts.Responses
{
    public class ParticipantDetailsResponseTest
    {
        [Test]
        public void Should_instances_be_equal()
        {
            var instance1 = new ParticipantDetailsResponse();
            var instance2 = new ParticipantDetailsResponse();

            var result = instance1.Equals(instance2);
            result.Should().BeTrue();
        }
        [Test]
        public void Should_not_be_equal_to_null()
        {
            var instance1 = new ParticipantDetailsResponse();
            ParticipantDetailsResponse instance2 = null;

            var result = instance1.Equals(instance2);
            result.Should().BeFalse();
        }

        [Test]
        public void Should_not_be_equal_if_instances_has_different_Id()
        {
            var instance1 = new ParticipantDetailsResponse();
            var instance2 = new ParticipantDetailsResponse();
            instance2.Id = "123";

            var result = instance1.Equals(instance2);
            result.Should().BeFalse();
        }
    }
}
