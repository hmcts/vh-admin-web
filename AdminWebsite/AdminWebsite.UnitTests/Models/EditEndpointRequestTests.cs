﻿using System.Linq;
using AdminWebsite.Models;

namespace AdminWebsite.UnitTests.Models
{
    public class EditEndpointRequestTests
    {
        [Test]
        public void Should_equal_when_same_item()
        {
            var endpoint1 = new EditEndpointRequest {Id = Guid.NewGuid(),};
            var endpointList1 = new List<EditEndpointRequest> {endpoint1};
            var endpointList2 = endpointList1;
            ClassicAssert.True(endpointList1.SequenceEqual(endpointList2, EditEndpointRequest.EditEndpointRequestComparer));
        }

        [Test]
        public void Should_not_equal_when_id_different()
        {
            var endpoint1 = new EditEndpointRequest {Id = Guid.NewGuid(),};
            var endpoint2 = new EditEndpointRequest {Id = Guid.NewGuid(),};
            var endpointList1 = new List<EditEndpointRequest> {endpoint1};
            var endpointList2 = new List<EditEndpointRequest> {endpoint2};
            ClassicAssert.False(endpointList1.SequenceEqual(endpointList2, EditEndpointRequest.EditEndpointRequestComparer));
        }
        [Test]
        public void Should_not_equal_when_DisplayName_different()
        {
            var endpoint1 = new EditEndpointRequest
            {
                Id = It.IsAny<Guid>(),
                DisplayName = "EditEndpointDisplayName1",
            };
            var endpoint2 = new EditEndpointRequest
            {
                Id = It.IsAny<Guid>(),
                DisplayName = "EditEndpointDisplayName2",
            };
            var endpointList1 = new List<EditEndpointRequest> { endpoint1 };
            var endpointList2 = new List<EditEndpointRequest> { endpoint2 };
            ClassicAssert.False(endpointList1.SequenceEqual(endpointList2, EditEndpointRequest.EditEndpointRequestComparer));
        }
        [Test]
        public void Equals_DifferentDisplayName_False()
        {
            var endpoint1 = new EditEndpointRequest
            {
                Id = It.IsAny<Guid>(),
                LinkedParticipantEmails = [Guid.NewGuid().ToString()]
            };
            var endpoint2 = new EditEndpointRequest
            {
                Id = It.IsAny<Guid>(),
                LinkedParticipantEmails = [Guid.NewGuid().ToString()]
            };
            var endpointList1 = new List<EditEndpointRequest> { endpoint1 };
            var endpointList2 = new List<EditEndpointRequest> { endpoint2 };
            ClassicAssert.False(endpointList1.SequenceEqual(endpointList2, EditEndpointRequest.EditEndpointRequestComparer));
        }

        [Test]
        public void Should_not_equal_when_request_is_null()
        {
            var endpoint1 = new EditEndpointRequest
            {
                Id = It.IsAny<Guid>(),
                LinkedParticipantEmails = [Guid.NewGuid().ToString()]
            };
            var endpointList1 = new List<EditEndpointRequest> { endpoint1 };
            var endpointList2 = new List<EditEndpointRequest> { null };
            ClassicAssert.False(endpointList1.SequenceEqual(endpointList2, EditEndpointRequest.EditEndpointRequestComparer));
            ClassicAssert.False(endpointList2.SequenceEqual(endpointList1, EditEndpointRequest.EditEndpointRequestComparer));
        }
    }
}
