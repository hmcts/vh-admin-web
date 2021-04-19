using AdminWebsite.Validators;
using NUnit.Framework;
using System;
using System.Linq;
using BookingsApi.Contract.Requests;

namespace AdminWebsite.UnitTests.Validators
{
    public class CaseRequestValidationTest
    {
        private CaseRequestValidation _validator;

        [SetUp]
        public void SetUp()
        {
            _validator = new CaseRequestValidation();
        }

        [Test]
        public void Should_validate_CaseNumber_and_name_with_length_greater_then_255_as_error()
        {
        const string CaseNumber_MESSAGE = "Case number is required between 1 - 255 characters";
         const string CaseName_MESSAGE = "Case name is required between 1 - 255 characters";

        var longString = new String('a', 257);
            var testRequest = new CaseRequest { Number = longString, Name=longString };
            var result = _validator.Validate(testRequest);
            Assert.That(result.Errors.Any(o => o.PropertyName == "Number" && o.ErrorMessage == CaseNumber_MESSAGE));
            Assert.That(result.Errors.Any(o => o.PropertyName == "Name" && o.ErrorMessage == CaseName_MESSAGE));
        }

        [Test]
        public void Should_validate_CaseNumber_and_name_with_length_zero_as_error()
        {
            var shortString = "";
            var testRequest = new CaseRequest { Number = shortString, Name = shortString };
            var result = _validator.Validate(testRequest);
            Assert.That(result.Errors.All(o => o.ErrorMessage.Contains("must not be empty.")));
            Assert.That(result.Errors.Count == 2);
        }

        [Test]
        public void Should_validate_case_request()
        {
            var testRequest = new CaseRequest
            {
                Name = "case name",
                Number = "case number 1"
            };

            var result = _validator.Validate(testRequest);
            Assert.That(result.Errors.Count == 0);
        }
    }
}
