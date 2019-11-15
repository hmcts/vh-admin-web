using AdminWebsite.Models;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class EditParticipantRequestValidation : AbstractValidator<EditParticipantRequest>
    {
        public EditParticipantRequestValidation()
        {
            RuleFor(x => x.ContactEmail)
                .NotEmpty()
                .EmailAddress()
                .MaximumLength(255)
                .WithMessage("Email is required in the correct format and between 1 - 255 characters");

            RuleFor(x => x.DisplayName)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage("Display name is required and between 1 - 255 characters");

            RuleFor(x => x.FirstName)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage("First name is required and between 1 - 255 characters");

            RuleFor(x => x.LastName)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage("Lastname is required and between 1 - 255 characters");
        }
    }
}