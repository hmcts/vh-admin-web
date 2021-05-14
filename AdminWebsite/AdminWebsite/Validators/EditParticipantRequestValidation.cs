using AdminWebsite.Models;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class EditParticipantRequestValidation : AbstractValidator<EditParticipantRequest>
    {
        private const string EMAIL_MSG = "Email is required in the correct format and between 1 - 255 characters";
        private const string DisplayName_MSG = "Display name is required and between 1 - 255 characters";
        private const string FirstName_MSG = "First name is required and between 1 - 255 characters";
        private const string LASTNAME_MSG = "Lastname is required and between 1 - 255 characters";

        public EditParticipantRequestValidation()
        {
            RuleFor(x => x.ContactEmail)
                .NotEmpty()
                .EmailAddress()
                .MaximumLength(255)
                .WithMessage(EMAIL_MSG);

            RuleFor(x => x.DisplayName)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(DisplayName_MSG);

            RuleFor(x => x.FirstName)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(FirstName_MSG);

            RuleFor(x => x.LastName)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(LASTNAME_MSG);
        }
    }
}