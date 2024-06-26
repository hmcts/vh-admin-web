﻿using AdminWebsite.Models;
using AdminWebsite.Validators;
using System.Linq;
using AdminWebsite.Contracts.Requests;

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
            ClassicAssert.That(result.Errors.Exists(o => o.PropertyName == "Participants" && o.ErrorMessage == PARTICIPANT_MSG));
        }

        [Test]
        public void Should_validate_participants_with_empty_list_as_error()
        {
            const string PARTICIPANT_MSG = "Please provide at least one participant";

            var testRequest = new EditHearingRequest { Participants = new List<EditParticipantRequest>() };
            var result = _validator.Validate(testRequest);
            ClassicAssert.That(result.Errors.Exists(o => o.PropertyName == "Participants" && o.ErrorMessage == PARTICIPANT_MSG));
        }

        [Test]
        public void Should_validate_participants_as_valid()
        {
            var testRequest = new EditHearingRequest {
                Participants = new List<EditParticipantRequest> { new EditParticipantRequest() },
                Case = new EditCaseRequest(),
            };
            var result = _validator.Validate(testRequest);
            ClassicAssert.That(!result.Errors.Exists(o => o.PropertyName == "Participants"));
        }
        
        [Test]
        public void Should_validate_participants_as_valid_when_judiciary_participants_are_provided()
        {
            var testRequest = new EditHearingRequest {
                JudiciaryParticipants = new List<JudiciaryParticipantRequest> { new() },
                Case = new EditCaseRequest(),
            };
            var result = _validator.Validate(testRequest);
            ClassicAssert.That(!result.Errors.Exists(o => o.PropertyName == "Participants"));
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
            ClassicAssert.That(!result.Errors.Exists(o => o.ErrorMessage == SCHEDLUED_TIME_MSG));
        }
    }
}
