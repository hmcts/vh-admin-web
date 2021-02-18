using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.BookingsAPI.Client;
using NotificationApi.Contract;
using NotificationApi.Contract.Requests;

namespace AdminWebsite.Mappers
{
    public static class AddNotificationRequestMapper
    {
        private const string Individual = "INDIVIDUAL";

        public static AddNotificationRequest MapToNewUserNotification(Guid hearingId, ParticipantResponse participant, string password)
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
                NotificationType = participant.User_role_name.ToUpper() == Individual ? NotificationType.CreateIndividual : NotificationType.CreateRepresentative,
                ParticipantId = participant.Id,
                PhoneNumber = participant.Telephone_number,
                Parameters = parameters
            };
            return addNotificationRequest;
        }

        public static AddNotificationRequest MapToPasswordResetNotification(string name, string newPassword, string contactEmail)
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

        public static AddNotificationRequest MapToHearingAmendmentNotification(Guid hearingId,
            ParticipantResponse participant, string caseName, string caseNumber, DateTime originalDateTime, DateTime newDateTime)
        {
            var originalTime = originalDateTime.ToString("h:mm tt");
            var originalDate = originalDateTime.ToString("d MMMM yyyy");
            var newTime = newDateTime.ToString("h:mm tt");
            var newDate = newDateTime.ToString("d MMMM yyyy");

            var parameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"Old time",originalTime},
                {"New time",newTime},
                {"Old Day Month Year",originalDate},
                {"New Day Month Year",newDate}
            };
        
            NotificationType notificationType;
            if (participant.User_role_name.Contains("Judge", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingAmendmentJudge;
                parameters.Add("judge", participant.Display_name);
                parameters.Add("courtroom account username", participant.Username);
            }
            else if (participant.User_role_name.Contains("Judicial Office Holder", StringComparison.InvariantCultureIgnoreCase))
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
                HearingId = hearingId,
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
            var time = hearing.Scheduled_date_time.ToString("h:mm tt");
            var date = hearing.Scheduled_date_time.ToString("d MMMM yyyy");
            
            var parameters = new Dictionary<string, string>
            {
                {"case name", @case.Name},
                {"case number", @case.Number},
                {"time",time},
                {"day month year",date},
            };
            
            NotificationType notificationType;
            if (participant.User_role_name.Contains("Judge", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationJudge;
                parameters.Add("judge", participant.Display_name);
                parameters.Add("courtroom account username", participant.Username);
            }
            else if (participant.User_role_name.Contains("Judicial Office Holder", StringComparison.InvariantCultureIgnoreCase))
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
        
        public static AddNotificationRequest MapToMultiDayHearingConfirmationNotification(HearingDetailsResponse hearing,
            ParticipantResponse participant, int days)
        {
            var @case = hearing.Cases.First();
            var time = hearing.Scheduled_date_time.ToString("h:mm tt");
            var date = hearing.Scheduled_date_time.ToString("d MMMM yyyy");

            var parameters = new Dictionary<string, string>
            {
                {"case name", @case.Name},
                {"case number", @case.Number},
                {"time", time},
                {"Start Day Month Year", date},
                {"number of days", days.ToString()}
            };
            
            NotificationType notificationType;
            if (participant.User_role_name.Contains("Judge", StringComparison.InvariantCultureIgnoreCase))
            {
                notificationType = NotificationType.HearingConfirmationJudgeMultiDay;
                parameters.Add("judge", participant.Display_name);
                parameters.Add("courtroom account username", participant.Username);
            }
            else if (participant.User_role_name.Contains("Judicial Office Holder", StringComparison.InvariantCultureIgnoreCase))
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
    }
}
