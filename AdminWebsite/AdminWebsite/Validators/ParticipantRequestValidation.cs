using AdminWebsite.BookingsAPI.Client;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class ParticipantRequestValidation : AbstractValidator<ParticipantRequest>
    {
        public static readonly string ContactEmailMessage = "Email is required in the correct format and between 1 - 255 characters";

        public ParticipantRequestValidation()
        {
            RuleFor(x => x.Contact_email).NotEmpty().EmailAddress().MaximumLength(255).WithMessage(ContactEmailMessage);
        }
    }
}