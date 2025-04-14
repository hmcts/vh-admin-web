using System.Linq;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Contract.Interfaces.Requests;
using BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.UnitTests.Mappers;

[TestFixture]
public class UpdateEndpointRequestV2MapperTests
{
    [Test]
    public void should_correctly_map_to_UpdateEndpointRequest()
    {
        // Arrange
        var hearing = new HearingDetailsResponse
        {
            Endpoints =
            [
                new EndpointResponse()
                {
                    Id = Guid.NewGuid(),
                    DisplayName = "Existing Endpoint",
                    LinkedParticipantIds = new List<Guid> { Guid.NewGuid() }
                }
            ],
            Participants = [new ParticipantResponse() { Id = Guid.NewGuid(), ContactEmail = "existing@participant.com" }]
        };

        var editEndpointRequest = new EditEndpointRequest
        {
            Id = hearing.Endpoints[0].Id,
            DisplayName = "Updated Endpoint",
            LinkedParticipantEmails = new List<string> { "new@participant.com" },
            InterpreterLanguageCode = "spa",
            ScreeningRequirements = new SpecialMeasureScreeningRequest
            {
                ScreenAll = false,
                ScreenFromExternalReferenceIds = new List<string> { "xyz" }
            },
            ExternalReferenceId = "external-id"
        };

        var newParticipantList = new List<IParticipantRequest>
        {
            new ParticipantRequestV2 { ContactEmail = "new@participant.com" }
        };

        // Act
        var result = UpdateEndpointRequestV2Mapper.Map(hearing, editEndpointRequest, newParticipantList);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(editEndpointRequest.Id.Value);
        result.DisplayName.Should().Be(editEndpointRequest.DisplayName);
        result.LinkedParticipantEmails.Should().BeEquivalentTo(editEndpointRequest.LinkedParticipantEmails);
        result.InterpreterLanguageCode.Should().Be(editEndpointRequest.InterpreterLanguageCode);
        result.Screening.ProtectedFrom.Should().BeEquivalentTo(editEndpointRequest.ScreeningRequirements.ScreenFromExternalReferenceIds);
        result.ExternalParticipantId.Should().Be(editEndpointRequest.ExternalReferenceId);
    }

    [Test]
    public void Should_return_true_when_EndpointStateUnchanged_called()
    {
        //arrange
        var linkedParticipantIds = new List<Guid> { Guid.NewGuid() };
        var endpointRequestParticipants = linkedParticipantIds
            .Select(id => new EndpointParticipant() { Id = id, ContactEmail = "contact@email.com" })
            .ToList();
        var existing = new EndpointResponse
        {
            DisplayName = "Existing Endpoint",
            ExternalReferenceId = "existing-id",
            LinkedParticipantIds = linkedParticipantIds
        };
        var updated = new EditEndpointRequest()
        {
            DisplayName = "Existing Endpoint",
            ExternalReferenceId = "existing-id",
            LinkedParticipantEmails = endpointRequestParticipants.Select(e => e.ContactEmail).ToList()
        };
        //act
        var result = UpdateEndpointRequestV2Mapper.EndpointStateUnchanged(existing, updated, endpointRequestParticipants);
        //assert
        result.Should().BeTrue();
    }

    [Test]
    public void Should_return_false_when_EndpointStateUnchanged_called_display_name_changed()
    {
        //arrange
        var linkedParticipantIds = new List<Guid> { Guid.NewGuid() };
        var endpointRequestParticipants = linkedParticipantIds
            .Select(id => new EndpointParticipant() { Id = id, ContactEmail = "contact@email.com" })
            .ToList();
        var existing = new EndpointResponse
        {
            DisplayName = "Existing Endpoint",
            ExternalReferenceId = "existing-id",
            LinkedParticipantIds = linkedParticipantIds
        };
        var updated = new EditEndpointRequest()
        {
            DisplayName = "NEW Endpoint Name",
            ExternalReferenceId = "existing-id",
            LinkedParticipantEmails = endpointRequestParticipants.Select(e => e.ContactEmail).ToList()
        };
        //act
        var result = UpdateEndpointRequestV2Mapper.EndpointStateUnchanged(existing, updated, endpointRequestParticipants);
        //assert
        result.Should().BeFalse();
    }

    [Test]
    public void Should_return_false_when_EndpointStateUnchanged_called_Id_changed()
    {
        //arrange
        var linkedParticipantIds = new List<Guid> { Guid.NewGuid() };
        var endpointRequestParticipants = linkedParticipantIds
            .Select(id => new EndpointParticipant() { Id = id, ContactEmail = "contact@email.com" })
            .ToList();
        var existing = new EndpointResponse
        {
            DisplayName = "Existing Endpoint",
            ExternalReferenceId = "existing-id",
            LinkedParticipantIds = linkedParticipantIds
        };
        var updated = new EditEndpointRequest()
        {
            DisplayName = "Existing Endpoint",
            ExternalReferenceId = "new-id",
            LinkedParticipantEmails = endpointRequestParticipants.Select(e => e.ContactEmail).ToList()
        };
        //act
        var result = UpdateEndpointRequestV2Mapper.EndpointStateUnchanged(existing, updated, endpointRequestParticipants);
        //assert
        result.Should().BeFalse();
    }


    [Test]
    public void Should_return_false_when_EndpointStateUnchanged_called_participant_changed()
    {
        //arrange
        var linkedParticipantIds = new List<Guid> { Guid.NewGuid() };
        var endpointRequestParticipants = linkedParticipantIds
            .Select(id => new EndpointParticipant() { Id = id, ContactEmail = "contact@email.com" })
            .ToList();
        var existing = new EndpointResponse
        {
            DisplayName = "Existing Endpoint",
            ExternalReferenceId = "existing-id",
            LinkedParticipantIds = linkedParticipantIds
        };
        var updated = new EditEndpointRequest()
        {
            DisplayName = "Existing Endpoint",
            ExternalReferenceId = "new-id",
            LinkedParticipantEmails = []
        };
        //act
        var result = UpdateEndpointRequestV2Mapper.EndpointStateUnchanged(existing, updated, endpointRequestParticipants);
        //assert
        result.Should().BeFalse();
    }
}