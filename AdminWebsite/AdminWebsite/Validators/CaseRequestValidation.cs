using AdminWebsite.BookingsAPI.Client;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class CaseRequestValidation : AbstractValidator<CaseRequest>
    {
        private const string MESSAGE = "Case number is required between 1 - 255 characters";
        public CaseRequestValidation()
        {
            RuleFor(x => x.Number)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(MESSAGE);

            RuleFor(x => x.Name)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(MESSAGE);
        }
    }
}