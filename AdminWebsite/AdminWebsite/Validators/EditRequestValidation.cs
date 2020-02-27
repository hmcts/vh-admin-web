using AdminWebsite.Models;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class EditRequestValidation : AbstractValidator<EditCaseRequest>
    {
        private const string CASE_NUMBER_MSG = "Case number is required between 1 - 255 characters";
        private const string CASE_NAME_MSG = "Case name is required between 1 - 255 characters";

        public EditRequestValidation()
        {
            RuleFor(x => x.Number)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(CASE_NUMBER_MSG);

            RuleFor(x => x.Name)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage(CASE_NAME_MSG);
        }
    }
}