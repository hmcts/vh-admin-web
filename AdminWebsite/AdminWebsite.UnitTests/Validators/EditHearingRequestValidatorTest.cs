using AdminWebsite.Configuration;
using AdminWebsite.Helper;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UserAPI.Client;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.UnitTests.Helper;
using AdminWebsite.Validators;
using AdminWebsite.Models;
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
    }
}
