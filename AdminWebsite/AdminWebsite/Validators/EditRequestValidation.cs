using AdminWebsite.Models;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class EditRequestValidation : AbstractValidator<EditCaseRequest>
    {
        private const string CaseNumber_MSG = "Case number is required between 1 - 255 characters";
        private const string CaseName_MSG = "Case name is required between 1 - 255 characters";

        public EditRequestValidation()
        {
            RuleFor(x => x.Number)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(CaseNumber_MSG);

            RuleFor(x => x.Name)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(CaseName_MSG);
        }
    }
}