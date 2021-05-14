using System;
using AdminWebsite.Mappers;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers
{
    public class EditParticipantRequestMapperTest
    {
        [Test]
        public void Should_map_all_properties_for_Edit_participant_request()
        {
            var source = new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Title = "Mr",
                FirstName = "TestF",
                MiddleNames = "TestM",
                LastName = "TestL",
                ContactEmail = "test@test.com",
                TelephoneNumber = "123",
                DisplayName = "test",
                CaseRoleName = "test Case Role Name",
                HearingRoleName = "test Hearting Role Name",
                Representee = "test Re",
                Organisation = "test Or"
            };
            var result = EditParticipantRequestMapper.MapFrom(source);

            result.Id.Should().Be(source.Id);
            result.Title.Should().Be(source.Title);
            result.MiddleNames.Should().Be(source.MiddleNames);
            result.LastName.Should().Be(source.LastName);
            result.ContactEmail.Should().Be(source.ContactEmail);
            result.TelephoneNumber.Should().Be(source.TelephoneNumber);
            result.DisplayName.Should().Be(source.DisplayName);
            result.CaseRoleName.Should().Be(source.CaseRoleName);
            result.HearingRoleName.Should().Be(source.HearingRoleName);
            result.Representee.Should().Be(source.Representee);
            result.OrganisationName.Should().Be(source.Organisation);
        }
    }
}
