using AdminWebsite.Validators;
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
            const string DisplayName_MSG = "Display name is required and between 1 - 255 characters";
            const string FirstName_MSG = "First name is required and between 1 - 255 characters";
            const string LASTNAME_MSG = "Lastname is required and between 1 - 255 characters";


            var longString = new String('a', 257);
            var testRequest = new BookingsApi.Contract.V1.Requests.ParticipantRequest
            {
                ContactEmail = longString,
                DisplayName = longString,
                FirstName = longString,
                LastName = longString
            };

            var result = _validator.Validate(testRequest);
            ClassicAssert.That(result.Errors.Any(o => o.PropertyName == "ContactEmail" && o.ErrorMessage == EMAIL_MSG));
            ClassicAssert.That(result.Errors.Any(o => o.PropertyName == "DisplayName" && o.ErrorMessage == DisplayName_MSG));
            ClassicAssert.That(result.Errors.Any(o => o.PropertyName == "FirstName" && o.ErrorMessage == FirstName_MSG));
            ClassicAssert.That(result.Errors.Any(o => o.PropertyName == "LastName" && o.ErrorMessage == LASTNAME_MSG));

        }

        [Test]
        public void Should_validate_fields_with_length_zero_as_error()
        {
            var shortString = "";
            var testRequest = new BookingsApi.Contract.V1.Requests.ParticipantRequest
            {
                ContactEmail = shortString,
                DisplayName = shortString,
                FirstName = shortString,
                LastName = shortString
            };
            var result = _validator.Validate(testRequest);
            ClassicAssert.That(result.Errors.Any(o => o.ErrorMessage.Contains("must not be empty.")));
            ClassicAssert.That(result.Errors.Count == 5);
        }

        [Test]
        public void Should_validate_participant_request()
        {
            var testRequest = new BookingsApi.Contract.V1.Requests.ParticipantRequest
            {
                ContactEmail = "aa@hmcts.net",
                FirstName = "Adam",
                LastName = "Adams",
                DisplayName = "Adam"
            };

            var result = _validator.Validate(testRequest);
            ClassicAssert.That(result.Errors.Count == 0);
        }
    }
}
