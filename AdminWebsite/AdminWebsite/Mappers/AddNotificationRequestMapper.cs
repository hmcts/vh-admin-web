using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Extensions;
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
                {"name", $"{participant.First_name} {participant.Last_name}"},
                {"username", $"{participant.Username}"},
                {"random password", $"{password}"}
            };
            var addNotificationRequest = new AddNotificationRequest
            {
                HearingId = hearingId,
                MessageType = MessageType.Email,
                ContactEmail = participant.Contact_email,
                NotificationType = participant.User_role_name.ToUpper() == Individual
                    ? NotificationType.CreateIndividual
                    : NotificationType.CreateRepresentative,
                ParticipantId = participant.Id,
                PhoneNumber = participant.Telephone_number,
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
            if (participant.User_role_name.Contains("Judge", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingAmendmentJudge;
                parameters.Add("judge", participant.Display_name);
                parameters.Add("courtroom account username", participant.Username);
                participant.Contact_email = hearing.GetJudgeEmail();
                participant.Telephone_number = hearing.GetJudgePhone();
            }
            else if (participant.User_role_name.Contains("Judicial Office Holder",
                StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingAmendmentJoh;
                parameters.Add("judicial office holder", $"{participant.First_name} {participant.Last_name}");
            }
            else if (participant.User_role_name.Contains("Representative", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingAmendmentRepresentative;
                parameters.Add("client name", participant.Representee);
                parameters.Add("solicitor name", $"{participant.First_name} {participant.Last_name}");
            }
            else
            {
                notificationType = NotificationType.HearingAmendmentLip;
                parameters.Add("name", $"{participant.First_name} {participant.Last_name}");
            }

            return new AddNotificationRequest
            {
                HearingId = hearing.Id,
                MessageType = MessageType.Email,
                ContactEmail = participant.Contact_email,
                NotificationType = notificationType,
                ParticipantId = participant.Id,
                PhoneNumber = participant.Telephone_number,
                Parameters = parameters
            };
        }

        public static AddNotificationRequest MapToHearingConfirmationNotification(HearingDetailsResponse hearing,
            ParticipantResponse participant)
        {
            var @case = hearing.Cases.First();
            var parameters = new Dictionary<string, string>
            {
                {"case name", @case.Name},
                {"case number", @case.Number},
                {"time", hearing.Scheduled_date_time.ToEmailTimeGbLocale()},
                {"day month year", hearing.Scheduled_date_time.ToEmailDateGbLocale()}
            };

            NotificationType notificationType;
            if (participant.User_role_name.Contains("Judge", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationJudge;
                parameters.Add("judge", participant.Display_name);
                parameters.Add("courtroom account username", participant.Username);
                participant.Contact_email = hearing.GetJudgeEmail();
                participant.Telephone_number = hearing.GetJudgePhone();
            }
            else if (participant.User_role_name.Contains("Judicial Office Holder",
                StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationJoh;
                parameters.Add("judicial office holder", $"{participant.First_name} {participant.Last_name}");
            }
            else if (participant.User_role_name.Contains("Representative", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationRepresentative;
                parameters.Add("client name", participant.Representee);
                parameters.Add("solicitor name", $"{participant.First_name} {participant.Last_name}");
            }
            else
            {
                notificationType = NotificationType.HearingConfirmationLip;
                parameters.Add("name", $"{participant.First_name} {participant.Last_name}");
            }

            return new AddNotificationRequest
            {
                HearingId = hearing.Id,
                MessageType = MessageType.Email,
                ContactEmail = participant.Contact_email,
                NotificationType = notificationType,
                ParticipantId = participant.Id,
                PhoneNumber = participant.Telephone_number,
                Parameters = parameters
            };
        }

        public static AddNotificationRequest MapToMultiDayHearingConfirmationNotification(
            HearingDetailsResponse hearing,
            ParticipantResponse participant, int days)
        {
            var @case = hearing.Cases.First();
            var parameters = new Dictionary<string, string>
            {
                {"case name", @case.Name},
                {"case number", @case.Number},
                {"time", hearing.Scheduled_date_time.ToEmailTimeGbLocale()},
                {"Start Day Month Year", hearing.Scheduled_date_time.ToEmailDateGbLocale()},
                {"number of days", days.ToString()}
            };
            NotificationType notificationType;
            if (participant.User_role_name.Contains("Judge", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationJudgeMultiDay;
                parameters.Add("judge", participant.Display_name);
                parameters.Add("courtroom account username", participant.Username);
                participant.Contact_email = hearing.GetJudgeEmail();
                participant.Telephone_number = hearing.GetJudgePhone();
            }
            else if (participant.User_role_name.Contains("Judicial Office Holder",
                StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationJohMultiDay;
                parameters.Add("judicial office holder", $"{participant.First_name} {participant.Last_name}");
            }
            else if (participant.User_role_name.Contains("Representative", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationRepresentativeMultiDay;
                parameters.Add("client name", participant.Representee);
                parameters.Add("solicitor name", $"{participant.First_name} {participant.Last_name}");
            }
            else
            {
                notificationType = NotificationType.HearingConfirmationLipMultiDay;
                parameters.Add("name", $"{participant.First_name} {participant.Last_name}");
            }

            return new AddNotificationRequest
            {
                HearingId = hearing.Id,
                MessageType = MessageType.Email,
                ContactEmail = participant.Contact_email,
                NotificationType = notificationType,
                ParticipantId = participant.Id,
                PhoneNumber = participant.Telephone_number,
                Parameters = parameters
            };
        }

        public static AddNotificationRequest MapToHearingReminderNotification(HearingDetailsResponse hearing,
            ParticipantResponse participant)
        {
            var @case = hearing.Cases.First();
            var parameters = new Dictionary<string, string>
            {
                {"case name", @case.Name},
                {"case number", @case.Number},
                {"time", hearing.Scheduled_date_time.ToEmailTimeGbLocale()},
                {"day month year", hearing.Scheduled_date_time.ToEmailDateGbLocale()},
                {"username", participant.Username.ToLower()}
            };

            NotificationType notificationType;
            if (participant.User_role_name.Contains("Judicial Office Holder",
                StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingReminderJoh;
                parameters.Add("judicial office holder", $"{participant.First_name} {participant.Last_name}");
            }
            else if (participant.User_role_name.Contains("Representative", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingReminderRepresentative;
                parameters.Add("client name", participant.Representee);
                parameters.Add("solicitor name", $"{participant.First_name} {participant.Last_name}");
            }
            else
            {
                notificationType = NotificationType.HearingReminderLip;
                parameters.Add("name", $"{participant.First_name} {participant.Last_name}");
            }

            return new AddNotificationRequest
            {
                HearingId = hearing.Id,
                MessageType = MessageType.Email,
                ContactEmail = participant.Contact_email,
                NotificationType = notificationType,
                ParticipantId = participant.Id,
                PhoneNumber = participant.Telephone_number,
                Parameters = parameters
            };
        }
    }
}
