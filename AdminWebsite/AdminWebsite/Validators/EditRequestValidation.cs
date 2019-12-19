using AdminWebsite.Models;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class EditRequestValidation : AbstractValidator<EditCaseRequest>
    {
        public EditRequestValidation()
        {
            RuleFor(x => x.Number)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage("Case number is required between 1 - 255 characters");

            RuleFor(x => x.Name)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage("Case name is required between 1 - 255 characters");
        }
    }
}