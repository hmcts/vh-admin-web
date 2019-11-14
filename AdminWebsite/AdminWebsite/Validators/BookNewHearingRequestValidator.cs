using AdminWebsite.BookingsAPI.Client;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class BookNewHearingRequestValidator : AbstractValidator<BookNewHearingRequest>
    {
        public BookNewHearingRequestValidator()
        {
            RuleFor(x => x.Hearing_room_name)
                .MaximumLength(255)
                .WithMessage("Room name should be between 1 - 255 characters");
            
            RuleForEach(x => x.Cases).SetValidator(new CaseRequestValidation());
            RuleForEach(x => x.Participants).SetValidator(new ParticipantRequestValidation());
        }
    }
}