using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Extensions;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using Newtonsoft.Json;
using NotificationApi.Contract;
using NUnit.Framework;
using CaseResponse = BookingsApi.Contract.Responses.CaseResponse;

namespace AdminWebsite.UnitTests.Mappers.NotificationMappers
{
    public class MapToHearingConfirmationNotificationTests
    {
        [Test]
        public void should_map_to_ejud_judge_confirmation_notification()
        {
            var expectedNotificationType = NotificationType.HearingConfirmationEJudJudge;
            var participant = InitParticipant("Judge");
            participant.ContactEmail = "user@judiciarytest.com";
            var hearing = InitHearing();
            hearing.OtherInformation = string.Empty;
            hearing.Participants = new List<ParticipantResponse> { participant };

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", hearing.Cases.First().Name},
                {"case number", hearing.Cases.First().Number},
                {"time", "2:10 PM"},
                {"day month year", "12 October 2020"},
                {"judge", participant.DisplayName}
            };

            var result = AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, participant);

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
        public void should_map_to_ejud_joh_confirmation_notification()
        {
            var expectedNotificationType = NotificationType.HearingConfirmationEJudJoh;
            var participant = new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Username = "testusername@hmcts.net",
                CaseRoleName = "caserolename",
                ContactEmail = "contact@judiciary.hmcts.net",
                FirstName = "John",
                HearingRoleName = "hearingrolename",
                LastName = "Doe",
                TelephoneNumber = "0123456789",
                UserRoleName = "Judicial Office Holder",
                DisplayName = "Johnny"
            };

            var hearing = InitHearing();
            hearing.Participants = new List<ParticipantResponse> { participant };

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", hearing.Cases.First().Name},
                {"case number", hearing.Cases.First().Number},
                {"time", "2:10 PM"},
                {"day month year", "12 October 2020"},
                {"judicial office holder", $"{participant.FirstName} {participant.LastName}"}
            };

            var result = AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, participant);

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
        public void should_map_to_judge_confirmation_notification()
        {
            var expectedNotificationType = NotificationType.HearingConfirmationJudge;
            var participant = InitParticipant("Judge");
            var hearing = InitHearing();

            hearing.OtherInformation = new OtherInformationDetails
                {JudgeEmail = "judge@hmcts.net", JudgePhone = "123456789"}.ToOtherInformationString();
            
            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", hearing.Cases.First().Name},
                {"case number", hearing.Cases.First().Number},
                {"time", "2:10 PM"},
                {"day month year", "12 October 2020"},
                {"judge", participant.DisplayName},
                {"courtroom account username", participant.Username}
            };
            
            var result = AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, participant);
            
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
        public void Should_map_to_staffmember_confirmation_notification()
        {
            var expectedNotificationType = NotificationType.HearingConfirmationStaffMember;
            var participant = InitParticipant("Staff Member");
            var hearing = InitHearing();

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", hearing.Cases.First().Name},
                {"case number", hearing.Cases.First().Number},
                {"time", "2:10 PM"},
                {"day month year", "12 October 2020"},
                {"staff member", $"{participant.FirstName} {participant.LastName}"},
                {"username", participant.Username}
            };

            var result = AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, participant);

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
            var expectedNotificationType = NotificationType.HearingConfirmationLip;
            var participant = InitParticipant("Individual");
            var hearing = InitHearing();

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", hearing.Cases.First().Name},
                {"case number", hearing.Cases.First().Number},
                {"time", "2:10 PM"},
                {"day month year", "12 October 2020"},
                {"name", $"{participant.FirstName} {participant.LastName}"}
            };
            
            var result = AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, participant);
            
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
            var expectedNotificationType = NotificationType.HearingConfirmationRepresentative;
            var participant = InitParticipant("Representative", "Jane Doe");
            var hearing = InitHearing(); 
            
            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", hearing.Cases.First().Name},
                {"case number", hearing.Cases.First().Number},
                {"time", "2:10 PM"},
                {"day month year", "12 October 2020"},
                {"solicitor name", $"{participant.FirstName} {participant.LastName}"},
                {"client name", $"{participant.Representee}"}
            };

            var result = AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, participant);

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
            var expectedNotificationType = NotificationType.HearingConfirmationJoh;
            var participant = InitParticipant("Judicial Office Holder");
            var hearing = InitHearing();

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", hearing.Cases.First().Name},
                {"case number", hearing.Cases.First().Number},
                {"time", "2:10 PM"},
                {"day month year", "12 October 2020"},
                {"judicial office holder", $"{participant.FirstName} {participant.LastName}"}
            };

            var result = AddNotificationRequestMapper.MapToHearingConfirmationNotification(hearing, participant);

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
                Name = "Mapping test",
                Number = "12345678 MT"
            };

            return new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Cases = new List<CaseResponse> {@case},
                ScheduledDateTime = new DateTime(2020, 10, 12, 13, 10, 0, DateTimeKind.Utc),
                OtherInformation = JsonConvert.SerializeObject(new OtherInformationDetails {JudgeEmail = "judge@hmcts.net"}),
                Participants = new List<ParticipantResponse>()
            };
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