using AdminWebsite.BookingsAPI.Client;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class ParticipantRequestValidation : AbstractValidator<ParticipantRequest>
    {
        private const string EMAIL_MSG = "Email is required in the correct format and between 1 - 255 characters";
        private const string DISPLAY_NAME_MSG = "Display name is required and between 1 - 255 characters";
        private const string FIRST_NAME_MSG = "First name is required and between 1 - 255 characters";
        private const string LASTNAME_MSG = "Lastname is required and between 1 - 255 characters";

        public ParticipantRequestValidation()
        {
            RuleFor(x => x.Contact_email)
                .NotEmpty()
                .EmailAddress()
                .MaximumLength(255)
                .WithMessage(EMAIL_MSG);

            RuleFor(x => x.Display_name)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(DISPLAY_NAME_MSG);

            RuleFor(x => x.First_name)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(FIRST_NAME_MSG);

            RuleFor(x => x.Last_name)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(LASTNAME_MSG);
        }
    }
}