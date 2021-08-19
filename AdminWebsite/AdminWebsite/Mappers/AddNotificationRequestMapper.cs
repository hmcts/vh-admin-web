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
            NotificationType notificationType;

            if (participant.UserRoleName == "Staff Member")
            {
                notificationType = NotificationType.CreateStaffMember;
            }
            else
            {
                notificationType = participant.UserRoleName.ToUpper() == Individual
                    ? NotificationType.CreateIndividual
                    : NotificationType.CreateRepresentative;
            }
            var addNotificationRequest = new AddNotificationRequest
            {
                HearingId = hearingId,
                MessageType = MessageType.Email,
                ContactEmail = participant.ContactEmail,
                NotificationType = notificationType,
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
                 hearing.IsJudgeEmailEJud())
            {
                notificationType = NotificationType.HearingAmendmentEJudJudge;
                parameters.Add("judge", participant.DisplayName);
            }
            else if (participant.UserRoleName.Contains("Staff Member", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingAmendmentStaffMember;
                parameters.Add("staff member", $"{participant.FirstName} {participant.LastName}");
                parameters.Add("username", participant.Username);
            }
            else if (participant.UserRoleName.Contains("Judge", StringComparison.InvariantCultureIgnoreCase) &&
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
                notificationType = hearing.IsParticipantAEJudJudicialOfficeHolder(participant.Id) ? NotificationType.HearingAmendmentEJudJoh : NotificationType.HearingAmendmentJoh;
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
                hearing.IsJudgeEmailEJud())
            {
                notificationType = NotificationType.HearingConfirmationEJudJudge;
                parameters.Add("judge", participant.DisplayName);
            }
            else if (participant.UserRoleName.Contains("Staff Member", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationStaffMember;
                parameters.Add("staff member", $"{participant.FirstName} {participant.LastName}");
                parameters.Add("username", participant.Username);
            }
            else if (participant.UserRoleName.Contains("Judge", StringComparison.InvariantCultureIgnoreCase) &&
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
                notificationType = hearing.IsParticipantAEJudJudicialOfficeHolder(participant.Id) ? NotificationType.HearingConfirmationEJudJoh : NotificationType.HearingConfirmationJoh;
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

        public static AddNotificationRequest MapToTelephoneHearingConfirmationNotification(HearingDetailsResponse hearing,
            TelephoneParticipantResponse participant)
        {
            var parameters = InitConfirmReminderParams(hearing);

            parameters.Add("name", $"{participant.FirstName} {participant.LastName}");

            return new AddNotificationRequest
            {
                HearingId = hearing.Id,
                MessageType = MessageType.Email,
                ContactEmail = participant.ContactEmail,
                NotificationType = NotificationType.TelephoneHearingConfirmation,
                ParticipantId = participant.Id,
                PhoneNumber = participant.TelephoneNumber,
                Parameters = parameters
            };
        }

        public static AddNotificationRequest MapToTelephoneHearingConfirmationNotificationMultiDay(HearingDetailsResponse hearing,
            TelephoneParticipantResponse participant, int numberOfDays)
        {
            var parameters = InitConfirmReminderParams(hearing);

            parameters.Add("name", $"{participant.FirstName} {participant.LastName}");
            parameters.Add("number of days", $"{numberOfDays}");

            return new AddNotificationRequest
            {
                HearingId = hearing.Id,
                MessageType = MessageType.Email,
                ContactEmail = participant.ContactEmail,
                NotificationType = NotificationType.TelephoneHearingConfirmationMultiDay,
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
               hearing.IsJudgeEmailEJud())
            {
                notificationType = NotificationType.HearingConfirmationEJudJudgeMultiDay;
                parameters.Add("judge", participant.DisplayName);
            }
            else if (participant.UserRoleName.Contains("Staff Member", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationStaffMemberMultiDay;
                parameters.Add("staff member", $"{participant.FirstName} {participant.LastName}");
                parameters.Add("username", participant.Username);
            }
            else if (participant.UserRoleName.Contains("Judge", StringComparison.InvariantCultureIgnoreCase) &&
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
                notificationType = hearing.IsParticipantAEJudJudicialOfficeHolder(participant.Id) ? NotificationType.HearingConfirmationEJudJohMultiDay : NotificationType.HearingConfirmationJohMultiDay;
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
            var parameters = new Dictionary<string, string>()
            {
                {"case number",caseNumber},
                {"test type",testType},
                {"date",hearing.ScheduledDateTime.ToEmailDateGbLocale() },
                {"time",hearing.ScheduledDateTime.ToEmailTimeGbLocale()},
                {"username",participant.Username.ToLower()}
            };

            NotificationType notificationType = default;
            if (hearing.IsParticipantAEJudJudicialOfficeHolder(participant.Id))
            {
                notificationType = NotificationType.EJudJohDemoOrTest;
                parameters.Add("judicial office holder", $"{participant.FirstName} {participant.LastName}");
            }
            else if (participant.UserRoleName.Contains("Staff Member", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.StaffMemberDemoOrTest;
                parameters.Add("staff member", $"{participant.FirstName} {participant.LastName}");
            }
            else if (participant.UserRoleName.Contains("Judge", StringComparison.InvariantCultureIgnoreCase))
            {
                if (hearing.IsJudgeEmailEJud())
                {
                    notificationType = NotificationType.EJudJudgeDemoOrTest;
                }
                else
                {
                    notificationType = NotificationType.JudgeDemoOrTest;
                    parameters.Add("courtroom account username", participant.Username);
                }

                parameters.Add("judge", participant.DisplayName);
                parameters.Remove("username");
            }
            else
            {
                notificationType = NotificationType.ParticipantDemoOrTest;
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

        public static AddNotificationRequest MapToHearingReminderNotification(HearingDetailsResponse hearing,
            ParticipantResponse participant)
        {
            var parameters = InitConfirmReminderParams(hearing);
            parameters.Add("username", participant.Username.ToLower());

            NotificationType notificationType;
            if (participant.UserRoleName.Contains("Judicial Office Holder",
                StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = hearing.IsParticipantAEJudJudicialOfficeHolder(participant.Id) ? NotificationType.HearingReminderEJudJoh : NotificationType.HearingReminderJoh;
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