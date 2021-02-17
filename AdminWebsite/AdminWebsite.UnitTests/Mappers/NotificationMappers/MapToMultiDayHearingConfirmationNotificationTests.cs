using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Mappers;
using FluentAssertions;
using NotificationApi.Contract;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers.NotificationMappers
{
    public class MapToMultiDayHearingConfirmationNotificationTests
    {
        [Test]
        public void should_map_to_judge_confirmation_notification()
        {
            var expectedNotificationType = NotificationType.HearingConfirmationJudgeMultiDay;
            var participant = InitParticipant("Judge");
            var hearing = InitHearing();

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", hearing.Cases.First().Name},
                {"case number", hearing.Cases.First().Number},
                {"time", "1:10 PM"},
                {"Start Day Month Year", "12 October 2020"},
                {"judge", participant.Display_name},
                {"courtroom account username", participant.Username},
                {"number of days", "4"}
            };
            
            var result = AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(hearing, participant, 4);
            
            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.Contact_email);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.Telephone_number);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }
        
        [Test]
        public void should_map_to_lip_confirmation_notification()
        {
            var expectedNotificationType = NotificationType.HearingConfirmationLipMultiDay;
            var participant = InitParticipant("Individual");
            var hearing = InitHearing();

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", hearing.Cases.First().Name},
                {"case number", hearing.Cases.First().Number},
                {"time", "1:10 PM"},
                {"Start Day Month Year", "12 October 2020"},
                {"name", $"{participant.First_name} {participant.Last_name}"},
                {"number of days", "4"}
            };
            
            var result = AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(hearing, participant, 4);
            
            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.Contact_email);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.Telephone_number);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }
        
        [Test]
        public void should_map_to_representative_confirmation_notification()
        {
            var expectedNotificationType = NotificationType.HearingConfirmationRepresentativeMultiDay;
            var participant = InitParticipant("Representative", "Jane Doe");
            var hearing = InitHearing();

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", hearing.Cases.First().Name},
                {"case number", hearing.Cases.First().Number},
                {"time", "1:10 PM"},
                {"Start Day Month Year", "12 October 2020"},
                {"solicitor name", $"{participant.First_name} {participant.Last_name}"},
                {"client name", $"{participant.Representee}"},
                {"number of days", "4"}
            };
            
            var result = AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(hearing, participant, 4);
            
            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.Contact_email);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.Telephone_number);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }

        [Test]
        public void should_map_to_joh_confirmation_notification()
        {
            var expectedNotificationType = NotificationType.HearingConfirmationJohMultiDay;
            var participant = InitParticipant("Judicial Office Holder");
            var hearing = InitHearing();

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", hearing.Cases.First().Name},
                {"case number", hearing.Cases.First().Number},
                {"time", "1:10 PM"},
                {"Start Day Month Year", "12 October 2020"},
                {"judicial office holder", $"{participant.First_name} {participant.Last_name}"},
                {"number of days", "4"}
            };
            
            var result = AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(hearing, participant, 4);
            
            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.Contact_email);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.Telephone_number);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }

        private HearingDetailsResponse InitHearing()
        {
            var @case = new CaseResponse
            {
                Is_lead_case = true,
                Name = "Mapping test",
                Number = "12345678 MT"
            };

            return new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Cases = new List<CaseResponse> {@case},
                Scheduled_date_time = new DateTime(2020, 10, 12, 13, 10, 0)
                
            };
        }

        private ParticipantResponse InitParticipant(string userRole, string representee = null)
        {
            return new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Username = "testusername@hearing.com",
                Case_role_name = "caserolename",
                Contact_email = "contact@email.com",
                First_name = "John",
                Hearing_role_name = "hearingrolename",
                Last_name = "Doe",
                Telephone_number = "0123456789",
                User_role_name = userRole,
                Display_name = "Johnny",
                Representee = representee
            };
        }
    }
}