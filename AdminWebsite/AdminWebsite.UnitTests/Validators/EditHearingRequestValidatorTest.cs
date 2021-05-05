using AdminWebsite.Models;
using AdminWebsite.Validators;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;

namespace AdminWebsite.UnitTests.Validators
{
    public class EditHearingRequestValidatorTest
    {
        private EditHearingRequestValidator _validator;

        [SetUp]
        public void SetUp()
        {
            _validator = new EditHearingRequestValidator();
        }

        [Test]
        public void Should_validate_participants_with_value_null_as_error()
        {
            const string PARTICIPANT_MSG = "Please provide at least one participant";

            var testRequest = new EditHearingRequest { Participants = null };
            var result = _validator.Validate(testRequest);
            Assert.That(result.Errors.Any(o => o.PropertyName == "Participants" && o.ErrorMessage == PARTICIPANT_MSG));
        }

        [Test]
        public void Should_validate_participants_with_empty_list_as_error()
        {
            const string PARTICIPANT_MSG = "Please provide at least one participant";

            var testRequest = new EditHearingRequest { Participants = new List<EditParticipantRequest>() };
            var result = _validator.Validate(testRequest);
            Assert.That(result.Errors.Any(o => o.PropertyName == "Participants" && o.ErrorMessage == PARTICIPANT_MSG));
        }

        [Test]
        public void Should_validate_participants_as_valid()
        {
            var testRequest = new EditHearingRequest {
                Participants = new List<EditParticipantRequest> { new EditParticipantRequest() },
                Case = new EditCaseRequest(),
            };
            var result = _validator.Validate(testRequest);
            Assert.That(!result.Errors.Any(o => o.PropertyName == "Participants"));
        }

        [Test]
        public void Should_validate_scheduled_date_time_as_valid_when_time_is_within_thirty_minutes()
        {
            const string SCHEDLUED_TIME_MSG = "You can't edit a confirmed hearing within 30 minutes of it starting";

            var testRequest = new EditHearingRequest
            {
                ScheduledDateTime = DateTime.Now.AddMinutes(29)
            };
            var result = _validator.Validate(testRequest);
            Assert.That(result.Errors.Any(o =>  o.ErrorMessage == SCHEDLUED_TIME_MSG));
        }

        [Test]
        public void Should_validate_scheduled_date_time_as_error_when_time_is_thirty_minutes_or_more()
        {
            const string SCHEDLUED_TIME_MSG = "You can't edit a confirmed hearing within 30 minutes of it starting";

            var testRequest = new EditHearingRequest
            {
                ScheduledDateTime = DateTime.Now.AddMinutes(30)
            };
            var result = _validator.Validate(testRequest);
            Assert.That(!result.Errors.Any(o => o.ErrorMessage == SCHEDLUED_TIME_MSG));
        }
    }
}
