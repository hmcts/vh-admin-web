using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using FluentAssertions;
using Newtonsoft.Json;
using NotificationApi.Contract;
using NUnit.Framework;
using CaseResponse = AdminWebsite.BookingsAPI.Client.CaseResponse;

namespace AdminWebsite.UnitTests.Mappers.NotificationMappers
{
    public class MapToMultiDayHearingConfirmationNotificationTests
    {
        private string CaseName => "Mapping Test";
        
        [Test]
        public void should_map_to_judge_confirmation_notification()
        {
            var expectedNotificationType = NotificationType.HearingConfirmationJudgeMultiDay;
            var participant = InitParticipant("Judge");
            var hearing = InitHearing();
            hearing.Other_information = JsonConvert.SerializeObject(new OtherInformationDetails
                {JudgeEmail = "judge@hmcts.net", JudgePhone = "123456789"});

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", CaseName},
                {"case number", hearing.Cases.First().Number},
                {"time", "2:10 PM"},
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
                {"case name", CaseName},
                {"case number", hearing.Cases.First().Number},
                {"time", "2:10 PM"},
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
                {"case name", CaseName},
                {"case number", hearing.Cases.First().Number},
                {"time", "2:10 PM"},
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
                {"case name", CaseName},
                {"case number", hearing.Cases.First().Number},
                {"time", "2:10 PM"},
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
                Name = $"Day 1 of 4 {CaseName}",
                Number = "12345678 MT"
            };

            var h = new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Cases = new List<CaseResponse> {@case},
                Scheduled_date_time = new DateTime(2020, 10, 12, 13, 10, 0, DateTimeKind.Utc)
            };
            h.Group_id = h.Id;
            return h;
        }

        private ParticipantResponse InitParticipant(string userRole, string representee = null)
        {
            return new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Username = "testusername@hmcts.net",
                Case_role_name = "caserolename",
                Contact_email = "contact@hmcts.net",
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