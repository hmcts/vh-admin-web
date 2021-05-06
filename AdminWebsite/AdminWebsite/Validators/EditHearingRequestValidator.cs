using System;
using AdminWebsite.Models;
using FluentValidation;

namespace AdminWebsite.Validators
{
    public class EditHearingRequestValidator : AbstractValidator<EditHearingRequest>
    {
        private const string ROOM_MSG = "Room name should be between 1 - 255 characters";
        private const string PARTICIPANT_MSG = "Please provide at least one participant";
        private const string SCHEDLUED_TIME_MSG = "You can't edit a confirmed hearing within 30 minutes of it starting";

        public EditHearingRequestValidator()
        {
            RuleFor(x => x.HearingRoomName)
                .MaximumLength(255)
                .WithMessage(ROOM_MSG);

            RuleFor(x => x.Case).NotNull().SetValidator(new EditRequestValidation());

            RuleFor(x => x.Participants)
                .Must(x => x != null && x.Count > 0)
                .WithMessage(PARTICIPANT_MSG);

            RuleForEach(x => x.Participants).NotNull().SetValidator(new EditParticipantRequestValidation());

            // var timeToCheckHearingAgainst = DateTime.Now.AddMinutes(30);
            // RuleFor(x => x.ScheduledDateTime)
            //     .Must(x => x >= timeToCheckHearingAgainst)
            //     .WithMessage(SCHEDLUED_TIME_MSG);
        }
    }
}