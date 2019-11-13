using AdminWebsite.BookingsAPI.Client;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class ParticipantRequestValidation : AbstractValidator<ParticipantRequest>
    {
        public ParticipantRequestValidation()
        {
            RuleFor(x => x.Contact_email)
                .NotEmpty()
                .EmailAddress()
                .MaximumLength(255)
                .WithMessage("Email is required in the correct format and between 1 - 255 characters");

            RuleFor(x => x.Display_name)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage("Display name is required and between 1 - 255 characters");

            RuleFor(x => x.First_name)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage("First name is required and between 1 - 255 characters");

            RuleFor(x => x.Last_name)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage("Lastname is required and between 1 - 255 characters");
        }
    }
}