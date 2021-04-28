using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Extensions;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using NotificationApi.Contract;
using NUnit.Framework;
using CaseResponse = BookingsApi.Contract.Responses.CaseResponse;

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
            hearing.OtherInformation = new OtherInformationDetails
                {JudgeEmail = "judge@hmcts.net", JudgePhone = "123456789"}.ToOtherInformationString();

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", CaseName},
                {"case number", hearing.Cases.First().Number},
                {"time", "2:10 PM"},
                {"Start Day Month Year", "12 October 2020"},
                {"judge", participant.DisplayName},
                {"courtroom account username", participant.Username},
                {"number of days", "4"}
            };
            
            var result = AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(hearing, participant, 4);
            
            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.TelephoneNumber);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }
        
        [Test]
        public void should_map_to_ejud_judge_confirmation_notification()
        {
            var expectedNotificationType = NotificationType.HearingConfirmationEJudJudgeMultiDay;
            var participant = InitParticipant("Judge");
            participant.ContactEmail = "user@judiciarytest.com";
            var hearing = InitHearing();
            hearing.OtherInformation = string.Empty;
            hearing.Participants = new List<ParticipantResponse> {participant};

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", CaseName},
                {"case number", hearing.Cases.First().Number},
                {"time", "2:10 PM"},
                {"Start Day Month Year", "12 October 2020"},
                {"judge", participant.DisplayName},
                {"number of days", "4"}
            };
            
            var result = AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(hearing, participant, 4);
            
            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.TelephoneNumber);
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
                {"name", $"{participant.FirstName} {participant.LastName}"},
                {"number of days", "4"}
            };
            
            var result = AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(hearing, participant, 4);
            
            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.TelephoneNumber);
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
                {"solicitor name", $"{participant.FirstName} {participant.LastName}"},
                {"client name", $"{participant.Representee}"},
                {"number of days", "4"}
            };
            
            var result = AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(hearing, participant, 4);
            
            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.TelephoneNumber);
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
                {"judicial office holder", $"{participant.FirstName} {participant.LastName}"},
                {"number of days", "4"}
            };
            
            var result = AddNotificationRequestMapper.MapToMultiDayHearingConfirmationNotification(hearing, participant, 4);
            
            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.TelephoneNumber);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }

        private HearingDetailsResponse InitHearing()
        {
            var @case = new CaseResponse
            {
                IsLeadCase = true,
                Name = $"Day 1 of 4 {CaseName}",
                Number = "12345678 MT"
            };

            var h = new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Cases = new List<CaseResponse> {@case},
                ScheduledDateTime = new DateTime(2020, 10, 12, 13, 10, 0, DateTimeKind.Utc),
                Participants = new List<ParticipantResponse>()
            };
            h.GroupId = h.Id;
            return h;
        }

        private ParticipantResponse InitParticipant(string userRole, string representee = null)
        {
            return new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Username = "testusername@hmcts.net",
                CaseRoleName = "caserolename",
                ContactEmail = "contact@hmcts.net",
                FirstName = "John",
                HearingRoleName = "hearingrolename",
                LastName = "Doe",
                TelephoneNumber = "0123456789",
                UserRoleName = userRole,
                DisplayName = "Johnny",
                Representee = representee
            };
        }
    }
}