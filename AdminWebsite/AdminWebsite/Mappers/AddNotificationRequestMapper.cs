using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Extensions;
using BookingsApi.Contract.Responses;
using NotificationApi.Contract;
using NotificationApi.Contract.Requests;

namespace AdminWebsite.Mappers
{
    public static class AddNotificationRequestMapper
    {
        private const string Individual = "INDIVIDUAL";

        public static AddNotificationRequest MapToNewUserNotification(Guid hearingId, ParticipantResponse participant,
            string password)
        {
            var parameters = new Dictionary<string, string>
            {
                {"name", $"{participant.FirstName} {participant.LastName}"},
                {"username", $"{participant.Username}"},
                {"random password", $"{password}"}
            };
            var addNotificationRequest = new AddNotificationRequest
            {
                HearingId = hearingId,
                MessageType = MessageType.Email,
                ContactEmail = participant.ContactEmail,
                NotificationType = participant.UserRoleName.ToUpper() == Individual
                    ? NotificationType.CreateIndividual
                    : NotificationType.CreateRepresentative,
                ParticipantId = participant.Id,
                PhoneNumber = participant.TelephoneNumber,
                Parameters = parameters
            };
            return addNotificationRequest;
        }

        public static AddNotificationRequest MapToPasswordResetNotification(string name, string newPassword,
            string contactEmail)
        {
            var parameters = new Dictionary<string, string>
            {
                {"name", name},
                {"password", newPassword}
            };

            var addNotificationRequest = new AddNotificationRequest
            {
                MessageType = MessageType.Email,
                ContactEmail = contactEmail,
                NotificationType = NotificationType.PasswordReset,
                Parameters = parameters
            };
            return addNotificationRequest;
        }

        public static AddNotificationRequest MapToHearingAmendmentNotification(HearingDetailsResponse hearing,
            ParticipantResponse participant, string caseName, string caseNumber, DateTime originalDateTime,
            DateTime newDateTime)
        {
            var parameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"Old time", originalDateTime.ToEmailTimeGbLocale()},
                {"New time", newDateTime.ToEmailTimeGbLocale()},
                {"Old Day Month Year", originalDateTime.ToEmailDateGbLocale()},
                {"New Day Month Year", newDateTime.ToEmailDateGbLocale()}
            };

            NotificationType notificationType;
           if (participant.UserRoleName.Contains("Judge", StringComparison.InvariantCultureIgnoreCase) &&
                     !hearing.IsJudgeEmailEJud())
            {
                notificationType = NotificationType.HearingAmendmentJudge;
                parameters.Add("judge", participant.DisplayName);
                parameters.Add("courtroom account username", participant.Username);
                participant.ContactEmail = hearing.GetJudgeEmail();
                participant.TelephoneNumber = hearing.GetJudgePhone();
            }
            else if (participant.UserRoleName.Contains("Judicial Office Holder",
                StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingAmendmentJoh;
                parameters.Add("judicial office holder", $"{participant.FirstName} {participant.LastName}");
            }
            else if (participant.UserRoleName.Contains("Representative", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingAmendmentRepresentative;
                parameters.Add("client name", participant.Representee);
                parameters.Add("solicitor name", $"{participant.FirstName} {participant.LastName}");
            }
            else
            {
                notificationType = NotificationType.HearingAmendmentLip;
                parameters.Add("name", $"{participant.FirstName} {participant.LastName}");
            }

            return new AddNotificationRequest
            {
                HearingId = hearing.Id,
                MessageType = MessageType.Email,
                ContactEmail = participant.ContactEmail,
                NotificationType = notificationType,
                ParticipantId = participant.Id,
                PhoneNumber = participant.TelephoneNumber,
                Parameters = parameters
            };
        }

        public static AddNotificationRequest MapToHearingConfirmationNotification(HearingDetailsResponse hearing,
            ParticipantResponse participant)
        {
            var parameters = InitConfirmReminderParams(hearing);

            NotificationType notificationType;
           if (participant.UserRoleName.Contains("Judge", StringComparison.InvariantCultureIgnoreCase) &&
                     !hearing.IsJudgeEmailEJud())
            {
                notificationType = NotificationType.HearingConfirmationJudge;
                parameters.Add("judge", participant.DisplayName);
                parameters.Add("courtroom account username", participant.Username);
                participant.ContactEmail = hearing.GetJudgeEmail();
                participant.TelephoneNumber = hearing.GetJudgePhone();
            }
            else if (participant.UserRoleName.Contains("Judicial Office Holder",
                StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationJoh;
                parameters.Add("judicial office holder", $"{participant.FirstName} {participant.LastName}");
            }
            else if (participant.UserRoleName.Contains("Representative", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationRepresentative;
                parameters.Add("client name", participant.Representee);
                parameters.Add("solicitor name", $"{participant.FirstName} {participant.LastName}");
            }
            else
            {
                notificationType = NotificationType.HearingConfirmationLip;
                parameters.Add("name", $"{participant.FirstName} {participant.LastName}");
            }

            return new AddNotificationRequest
            {
                HearingId = hearing.Id,
                MessageType = MessageType.Email,
                ContactEmail = participant.ContactEmail,
                NotificationType = notificationType,
                ParticipantId = participant.Id,
                PhoneNumber = participant.TelephoneNumber,
                Parameters = parameters
            };
        }

        public static AddNotificationRequest MapToMultiDayHearingConfirmationNotification(
            HearingDetailsResponse hearing,
            ParticipantResponse participant, int days)
        {
            var @case = hearing.Cases.First();
            var cleanedCaseName = @case.Name.Replace($"Day 1 of {days}", string.Empty).Trim();
            var parameters = new Dictionary<string, string>
            {
                {"case name", cleanedCaseName},
                {"case number", @case.Number},
                {"time", hearing.ScheduledDateTime.ToEmailTimeGbLocale()},
                {"Start Day Month Year", hearing.ScheduledDateTime.ToEmailDateGbLocale()},
                {"number of days", days.ToString()}
            };
            NotificationType notificationType;
            if (participant.UserRoleName.Contains("Judge", StringComparison.InvariantCultureIgnoreCase) &&
                     !hearing.IsJudgeEmailEJud())
            {
                notificationType = NotificationType.HearingConfirmationJudgeMultiDay;
                parameters.Add("judge", participant.DisplayName);
                parameters.Add("courtroom account username", participant.Username);
                participant.ContactEmail = hearing.GetJudgeEmail();
                participant.TelephoneNumber = hearing.GetJudgePhone();
            }
            else if (participant.UserRoleName.Contains("Judicial Office Holder",
                StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationJohMultiDay;
                parameters.Add("judicial office holder", $"{participant.FirstName} {participant.LastName}");
            }
            else if (participant.UserRoleName.Contains("Representative", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationRepresentativeMultiDay;
                parameters.Add("client name", participant.Representee);
                parameters.Add("solicitor name", $"{participant.FirstName} {participant.LastName}");
            }
            else
            {
                notificationType = NotificationType.HearingConfirmationLipMultiDay;
                parameters.Add("name", $"{participant.FirstName} {participant.LastName}");
            }

            return new AddNotificationRequest
            {
                HearingId = hearing.Id,
                MessageType = MessageType.Email,
                ContactEmail = participant.ContactEmail,
                NotificationType = notificationType,
                ParticipantId = participant.Id,
                PhoneNumber = participant.TelephoneNumber,
                Parameters = parameters
            };
        }

        public static AddNotificationRequest MapToDemoOrTestNotification(HearingDetailsResponse hearing,
            ParticipantResponse participant, string caseNumber, string testType)
        {
            var parameters = new Dictionary<string, string>();
            NotificationType notificationType = default;
            if (hearing.IsParticipantAEJudJudicialOfficeHolder(participant.Id))
            {
                notificationType = NotificationType.EJudJohDemoOrTest;
                parameters.Add("judicial office holder", $"{participant.FirstName} {participant.LastName}");
            }
            else if(!hearing.IsParticipantAJudicialOfficeHolderOrJudge(participant.Id))
            {
                notificationType = NotificationType.ParticipantDemoOrTest;
                parameters.Add("name", $"{participant.FirstName} {participant.LastName}");
            }
            parameters.Add("case number", caseNumber);
            parameters.Add("test type", testType);
            parameters.Add("date", hearing.ScheduledDateTime.ToEmailDateGbLocale());
            parameters.Add("time", hearing.ScheduledDateTime.ToEmailTimeGbLocale());
            parameters.Add("username", participant.Username.ToLower());
            return new AddNotificationRequest
            {
                HearingId = hearing.Id,
                MessageType = MessageType.Email,
                ContactEmail = participant.ContactEmail,
                NotificationType = notificationType,
                ParticipantId = participant.Id,
                PhoneNumber = participant.TelephoneNumber,
                Parameters = parameters
            };
        }

        public static AddNotificationRequest MapToHearingReminderNotification(HearingDetailsResponse hearing,
            ParticipantResponse participant)
        {
            var parameters = InitConfirmReminderParams(hearing);
            parameters.Add("username", participant.Username.ToLower());

            NotificationType notificationType;
            if (participant.UserRoleName.Contains("Judicial Office Holder",
                StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingReminderJoh;
                parameters.Add("judicial office holder", $"{participant.FirstName} {participant.LastName}");
            }
            else if (participant.UserRoleName.Contains("Representative", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingReminderRepresentative;
                parameters.Add("client name", participant.Representee);
                parameters.Add("solicitor name", $"{participant.FirstName} {participant.LastName}");
            }
            else
            {
                notificationType = NotificationType.HearingReminderLip;
                parameters.Add("name", $"{participant.FirstName} {participant.LastName}");
            }

            return new AddNotificationRequest
            {
                HearingId = hearing.Id,
                MessageType = MessageType.Email,
                ContactEmail = participant.ContactEmail,
                NotificationType = notificationType,
                ParticipantId = participant.Id,
                PhoneNumber = participant.TelephoneNumber,
                Parameters = parameters
            };
        }

        private static Dictionary<string, string> InitConfirmReminderParams(HearingDetailsResponse hearing)
        {
            var @case = hearing.Cases.First();
            return new Dictionary<string, string>
            {
                {"case name", @case.Name},
                {"case number", @case.Number},
                {"time", hearing.ScheduledDateTime.ToEmailTimeGbLocale()},
                {"day month year", hearing.ScheduledDateTime.ToEmailDateGbLocale()}
            };
        }
    }
}