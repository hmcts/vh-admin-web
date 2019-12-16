using AdminWebsite.Models;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class EditHearingRequestValidator : AbstractValidator<EditHearingRequest>
    {
        public EditHearingRequestValidator()
        {
            RuleFor(x => x.HearingRoomName)
                .MaximumLength(255)
                .WithMessage("Room name should be between 1 - 255 characters");

            RuleFor(x => x.Case).NotNull().SetValidator(new EditRequestValidation());

            RuleFor(x => x.Participants)
                .Must(x => x != null && x.Count > 0)
                .WithMessage("Please provide at least one participant");

            RuleForEach(x => x.Participants).NotNull().SetValidator(new EditParticipantRequestValidation());
        }
    }
}