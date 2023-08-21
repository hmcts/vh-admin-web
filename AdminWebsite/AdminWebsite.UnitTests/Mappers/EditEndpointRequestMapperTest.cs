using System;
using AdminWebsite.Mappers;
using BookingsApi.Contract.V1.Responses;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers
{
    public class EditEndpointRequestMapperTest
    {
        [Test]
        public void Should_map_all_properties_for_Edit_endpoint_request()
        {
            var source = new EndpointResponse
            {
                Id = Guid.NewGuid(),
                DisplayName = "test",
                DefenceAdvocateId = Guid.NewGuid()
            };
            var result = EditEndpointRequestMapper.MapFrom(source);

            result.Id.Should().Be(source.Id);
            result.DisplayName.Should().Be(source.DisplayName);
            result.DefenceAdvocateContactEmail.Should().Be(source.DefenceAdvocateId.ToString());
        }
    }
}
