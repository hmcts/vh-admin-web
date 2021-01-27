using AdminWebsite.Mappers;
using AdminWebsite.Models;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers
{
    public class NewParticipantRequestMapperTest
    {
        [Test]
        public void Should_map_all_properties_for_new_participant_request()
        {
            var source = new EditParticipantRequest();
            source.CaseRoleName = "caserolename";
            source.ContactEmail = "contactemail";
            source.DisplayName = "displayname";
            source.FirstName = "firstname";
            source.LastName = "lastname";
            source.MiddleNames = "middle name";
            source.Representee = "representee";
            source.TelephoneNumber = "01234567489";
            source.Title = "mr";
            source.OrganisationName = "organisation";

            var result = NewParticipantRequestMapper.MapTo(source);

            result.Case_role_name.Should().Be(source.CaseRoleName);
            result.Contact_email.Should().Be(source.ContactEmail);
            result.Display_name.Should().Be(source.DisplayName);
            result.First_name.Should().Be(source.FirstName);
            result.Last_name.Should().Be(source.LastName);
            result.Hearing_role_name.Should().Be(source.HearingRoleName);
            result.Middle_names.Should().Be(source.MiddleNames);
            result.Representee.Should().Be(source.Representee);
            result.Telephone_number.Should().Be(source.TelephoneNumber);
            result.Title.Should().Be(source.Title);
            result.Organisation_name.Should().Be(source.OrganisationName);
        }
    }
}
