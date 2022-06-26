using System.Collections.Generic;
using AdminWebsite.Contracts.Enums;
using NotificationApi.Contract;
using NotificationApi.Contract.Requests;

namespace AdminWebsite.Mappers
{
    public static class AddNotificationRequestMapper
    {
        public static AddNotificationRequest MapToPasswordResetNotification(string name, string newPassword,
            string contactEmail)
        {
            var parameters = new Dictionary<string, string>
            {
                {NotifyParams.Name, name},
                {NotifyParams.Password, newPassword}
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
    }
}