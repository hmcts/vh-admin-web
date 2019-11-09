using AdminWebsite.BookingsAPI.Client;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class CaseRequestValidation : AbstractValidator<CaseRequest>
    {
        public static readonly string NoCaseNumberMessage = "Case number is required between 1 - 255 characters";
        public static readonly string NoCaseNameMessage = "Case name is required between 1 - 255 characters";

        public CaseRequestValidation()
        {
            RuleFor(x => x.Number).NotEmpty().MaximumLength(255).WithMessage(NoCaseNumberMessage);
            RuleFor(x => x.Name).NotEmpty().MaximumLength(255).WithMessage(NoCaseNameMessage);
        }
    }
}