using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using AdminWebsite.Models;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Models
{
    public class EditParticipantRequestTests
    {
        [Test]
        public void Should_equal_when_same_item()
        {
            var participantRequest1 = new EditParticipantRequest {Id = Guid.NewGuid(),};

            var editParticipants1 = new List<EditParticipantRequest> {participantRequest1};
            var editParticipants2 = editParticipants1;
            Assert.True(editParticipants1.SequenceEqual(editParticipants2,
                EditParticipantRequest.EditParticipantRequestComparer));
        }

        [Test]
        public void Should_not_equal_when_id_different()
        {
            var participantRequest1 = new EditParticipantRequest {Id = Guid.NewGuid(),};
            var participantRequest2 = new EditParticipantRequest {Id = Guid.NewGuid(),};

            var editParticipants1 = new List<EditParticipantRequest> {participantRequest1};
            var editParticipants2 = new List<EditParticipantRequest> {participantRequest2};
            Assert.False(editParticipants1.SequenceEqual(editParticipants2,
                EditParticipantRequest.EditParticipantRequestComparer));
        }

        [Test]
        public void Should_not_equal_when_title_different()
        {
            var participantRequest1 = new EditParticipantRequest {Id = It.IsAny<Guid>(), Title = "Mr",};
            var participantRequest2 = new EditParticipantRequest {Id = It.IsAny<Guid>(), Title = "Miss",};

            var editParticipants1 = new List<EditParticipantRequest> {participantRequest1};
            var editParticipants2 = new List<EditParticipantRequest> {participantRequest2};
            Assert.False(editParticipants1.SequenceEqual(editParticipants2,
                EditParticipantRequest.EditParticipantRequestComparer));
        }

        [Test]
        public void Should_not_equal_when_TelephoneNumber_different()
        {
            var participantRequest1 = new EditParticipantRequest {Id = It.IsAny<Guid>(), TelephoneNumber = "123",};
            var participantRequest2 = new EditParticipantRequest {Id = It.IsAny<Guid>(), TelephoneNumber = "12345678",};

            var editParticipants1 = new List<EditParticipantRequest> {participantRequest1};
            var editParticipants2 = new List<EditParticipantRequest> {participantRequest2};
            Assert.False(editParticipants1.SequenceEqual(editParticipants2,
                EditParticipantRequest.EditParticipantRequestComparer));
        }

        [Test]
        public void Should_not_equal_when_DisplayName_different()
        {
            var participantRequest1 = new EditParticipantRequest {Id = It.IsAny<Guid>(), DisplayName = "Test",};
            var participantRequest2 = new EditParticipantRequest {Id = It.IsAny<Guid>(), DisplayName = "Test1234",};

            var editParticipants1 = new List<EditParticipantRequest> {participantRequest1};
            var editParticipants2 = new List<EditParticipantRequest> {participantRequest2};
            Assert.False(editParticipants1.SequenceEqual(editParticipants2,
                EditParticipantRequest.EditParticipantRequestComparer));
        }

        [Test]
        public void Should_not_equal_when_Representee_different()
        {
            var participantRequest1 = new EditParticipantRequest
            {
                Id = It.IsAny<Guid>(), Representee = "Representee123",
            };
            var participantRequest2 = new EditParticipantRequest
            {
                Id = It.IsAny<Guid>(), Representee = "Representee12345678",
            };

            var editParticipants1 = new List<EditParticipantRequest> {participantRequest1};
            var editParticipants2 = new List<EditParticipantRequest> {participantRequest2};
            Assert.False(editParticipants1.SequenceEqual(editParticipants2,
                EditParticipantRequest.EditParticipantRequestComparer));
        }
        [Test]
        public void Should_not_equal_when_request_is_null()
        {
            var participantRequest1 = new EditParticipantRequest
            {
                Id = It.IsAny<Guid>(),
                Representee = "Representee123",
            };

            var editParticipants1 = new List<EditParticipantRequest> { participantRequest1 };
            var editParticipants2 = new List<EditParticipantRequest> { null };
            Assert.False(editParticipants1.SequenceEqual(editParticipants2,
                EditParticipantRequest.EditParticipantRequestComparer));
            Assert.False(editParticipants2.SequenceEqual(editParticipants1,
                EditParticipantRequest.EditParticipantRequestComparer));
        }
    }
}

