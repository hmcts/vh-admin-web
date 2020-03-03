using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Validators;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;

namespace AdminWebsite.UnitTests.Validators
{
    public class BookNewHearingRequestValidatorTest
    {
        private BookNewHearingRequestValidator _validator;

        [SetUp]
        public void SetUp()
        {
            _validator = new BookNewHearingRequestValidator();
        }

        [Test]
        public void Should_validate_hearing_room_with_length_greater_then_255_as_error()
        {
            const string MESSAGE = "Room name should be between 1 - 255 characters";
            var room = new String('a', 257);
            var testRequest = new BookNewHearingRequest { Hearing_room_name = room, Participants = null, Cases = null };
            var result = _validator.Validate(testRequest);
            Assert.That(result.Errors.Any(o => o.PropertyName == "Hearing_room_name" && o.ErrorMessage == MESSAGE));
        }

        [Test]
        public void Should_validate_hearing_room_with_value_between_1_and_255()
        {
            var testRequest = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>(),
                Cases = new List<CaseRequest>(),
                Hearing_room_name = "345"
            };

            var result = _validator.Validate(testRequest);
            Assert.That(result.Errors.Count == 0);
        }
    }
}
