using BookingsApi.Contract.Requests;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class CaseRequestValidation : AbstractValidator<CaseRequest>
    {
        private const string CaseNumber_MESSAGE = "Case number is required between 1 - 255 characters";
        private const string CaseName_MESSAGE = "Case name is required between 1 - 255 characters";

        public CaseRequestValidation()
        {
            RuleFor(x => x.Number)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(CaseNumber_MESSAGE);

            RuleFor(x => x.Name)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(CaseName_MESSAGE);
        }
    }
}