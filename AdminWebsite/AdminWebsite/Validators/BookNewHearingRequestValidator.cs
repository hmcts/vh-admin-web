using AdminWebsite.BookingsAPI.Client;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class BookNewHearingRequestValidator : AbstractValidator<BookNewHearingRequest>
    {
        private const string MESSAGE = "Room name should be between 1 - 255 characters";
        public BookNewHearingRequestValidator()
        {
            RuleFor(x => x.Hearing_room_name)
                .MaximumLength(255)
                .WithMessage(MESSAGE);

            RuleForEach(x => x.Cases)
                .NotNull()
                .SetValidator(new CaseRequestValidation());

            RuleForEach(x => x.Participants)
                .NotNull()
                .SetValidator(new ParticipantRequestValidation());
        }
    }
}