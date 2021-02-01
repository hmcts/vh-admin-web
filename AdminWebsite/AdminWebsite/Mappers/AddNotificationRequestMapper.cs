using System;
using System.Collections.Generic;
using AdminWebsite.BookingsAPI.Client;
using NotificationApi.Contract;
using NotificationApi.Contract.Requests;

namespace AdminWebsite.Mappers
{
    public static class AddNotificationRequestMapper
    {
        private const string Individual = "INDIVIDUAL";

        public static AddNotificationRequest MapTo(Guid hearingId, ParticipantResponse participant, string password)
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
    }
}
