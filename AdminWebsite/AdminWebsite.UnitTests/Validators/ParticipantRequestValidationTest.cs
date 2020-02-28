using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Validators;
using NUnit.Framework;
using System;
using System.Linq;

namespace AdminWebsite.UnitTests.Validators
{
    public class ParticipantRequestValidationTest
    {
        private ParticipantRequestValidation _validator;

        [SetUp]
        public void SetUp()
        {
            _validator = new ParticipantRequestValidation();
        }

        [Test]
        public void Should_validate_fields_with_length_greater_then_255_as_error()
        {
            const string EMAIL_MSG = "Email is required in the correct format and between 1 - 255 characters";
            const string DISPLAY_NAME_MSG = "Display name is required and between 1 - 255 characters";
            const string FIRST_NAME_MSG = "First name is required and between 1 - 255 characters";
            const string LASTNAME_MSG = "Lastname is required and between 1 - 255 characters";


            var longString = new String('a', 257);
            var testRequest = new BookingsAPI.Client.ParticipantRequest
            {
                Contact_email = longString,
                Display_name = longString,
                First_name = longString,
                Last_name = longString
            };

            var result = _validator.Validate(testRequest);
            Assert.That(result.Errors.Any(o => o.PropertyName == "Contact_email" && o.ErrorMessage == EMAIL_MSG));
            Assert.That(result.Errors.Any(o => o.PropertyName == "Display_name" && o.ErrorMessage == DISPLAY_NAME_MSG));
            Assert.That(result.Errors.Any(o => o.PropertyName == "First_name" && o.ErrorMessage == FIRST_NAME_MSG));
            Assert.That(result.Errors.Any(o => o.PropertyName == "Last_name" && o.ErrorMessage == LASTNAME_MSG));

        }

        [Test]
        public void Should_validate_fields_with_length_zero_as_error()
        {
            var shortString = "";
            var testRequest = new BookingsAPI.Client.ParticipantRequest
            {
                Contact_email = shortString,
                Display_name = shortString,
                First_name = shortString,
                Last_name = shortString
            };
            var result = _validator.Validate(testRequest);
            Assert.That(result.Errors.Any(o => o.ErrorMessage.Contains("must not be empty.")));
            Assert.That(result.Errors.Count == 5);
        }

        [Test]
        public void Should_validate_participant_request()
        {
            var testRequest = new BookingsAPI.Client.ParticipantRequest
            {
                Contact_email = "aa@aa.aa",
                First_name = "Adam",
                Last_name = "Adams",
                Display_name = "Adam"
            };

            var result = _validator.Validate(testRequest);
            Assert.That(result.Errors.Count == 0);
        }
    }
}
