using AdminWebsite.BookingsAPI.Client;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class CaseRequestValidation : AbstractValidator<CaseRequest>
    {
        private const string CASE_NUMBER_MESSAGE = "Case number is required between 1 - 255 characters";
        private const string CASE_NAME_MESSAGE = "Case name is required between 1 - 255 characters";

        public CaseRequestValidation()
        {
            RuleFor(x => x.Number)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(CASE_NUMBER_MESSAGE);

            RuleFor(x => x.Name)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(CASE_NAME_MESSAGE);
        }
    }
}