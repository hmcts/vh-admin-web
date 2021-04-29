using System;
using System.Collections.Generic;
using AdminWebsite.Extensions;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using NotificationApi.Contract;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers.NotificationMappers
{
    public class MapToHearingAmendmentNotificationTests
    {
        private HearingDetailsResponse _hearing;
        
        [SetUp]
        public void Setup()
        {
            _hearing = new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Participants = new List<ParticipantResponse>()
            };
        }
        
        [Test]
        public void should_map_to_judge_hearing_amendment_notification()
        {
            var expectedNotificationType = NotificationType.HearingAmendmentJudge;
            var oldDate = new DateTime(2020, 2, 10, 11, 30, 0, DateTimeKind.Utc);
            var newDate = new DateTime(2020, 10, 12, 13, 10, 0, DateTimeKind.Utc);
            var caseName = "cse test";
            var caseNumber = "MBFY/17364";
            var participant = InitParticipant("Judge");            
            var expectedConferencePhoneNumber = "phone_number";
            var expectedConferencePhoneId = "phone_id";
            _hearing.OtherInformation = new OtherInformationDetails
                {JudgeEmail = "judge@hmcts.net", JudgePhone = "123456789"}.ToOtherInformationString();
  
            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"judge", participant.DisplayName},
                {"courtroom account username", participant.Username},
                {"Old time", "11:30 AM"},
                {"New time", "2:10 PM"},
                {"Old Day Month Year", "10 February 2020"},
                {"New Day Month Year", "12 October 2020"},
                {"conference phone number", expectedConferencePhoneNumber},
                {"conference phone id", expectedConferencePhoneId},
            };

            var result =
                AddNotificationRequestMapper.MapToHearingAmendmentNotification(_hearing, participant, caseName,
                    caseNumber, oldDate, newDate, expectedConferencePhoneNumber, expectedConferencePhoneId);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(_hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.TelephoneNumber);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }
        
        [Test]
        public void should_map_to_ejud_judge_hearing_amendment_notification()
        {
            var expectedNotificationType = NotificationType.HearingAmendmentEJudJudge;
            var oldDate = new DateTime(2020, 2, 10, 11, 30, 0, DateTimeKind.Utc);
            var newDate = new DateTime(2020, 10, 12, 13, 10, 0, DateTimeKind.Utc);
            var caseName = "cse test";
            var caseNumber = "MBFY/17364";
            var participant = InitParticipant("Judge");
            participant.ContactEmail = "user@judiciarytest.com";
            _hearing.Participants = new List<ParticipantResponse> {participant};
            _hearing.OtherInformation = string.Empty;
            
            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"judge", participant.DisplayName},
                {"Old time", "11:30 AM"},
                {"New time", "2:10 PM"},
                {"Old Day Month Year", "10 February 2020"},
                {"New Day Month Year", "12 October 2020"}
            };

            var result =
                AddNotificationRequestMapper.MapToHearingAmendmentNotification(_hearing, participant, caseName,
                    caseNumber, oldDate, newDate, null, null);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(_hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.TelephoneNumber);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }

        [Test]
        public void should_map_to_lip_hearing_amendment_notification()
        {
            var expectedNotificationType = NotificationType.HearingAmendmentLip;
            var oldDate = new DateTime(2020, 2, 10, 11, 30, 0, DateTimeKind.Utc);
            var newDate = new DateTime(2020, 10, 12, 13, 10, 0, DateTimeKind.Utc);
            var caseName = "cse test";
            var caseNumber = "MBFY/17364";
            var participant = InitParticipant("Individual");
            var expectedConferencePhoneNumber = "phone_number";
            var expectedConferencePhoneId = "phone_id";

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"name", $"{participant.FirstName} {participant.LastName}"},
                {"Old time", "11:30 AM"},
                {"New time", "2:10 PM"},
                {"Old Day Month Year", "10 February 2020"},
                {"New Day Month Year", "12 October 2020"},
                {"conference phone number", expectedConferencePhoneNumber},
                {"conference phone id", expectedConferencePhoneId}
            };

            var result =
                AddNotificationRequestMapper.MapToHearingAmendmentNotification(_hearing, participant, caseName,
                    caseNumber, oldDate, newDate, expectedConferencePhoneNumber, expectedConferencePhoneId);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(_hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.TelephoneNumber);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }

        [Test]
        public void should_map_to_representative_hearing_amendment_notification()
        {
            var expectedNotificationType = NotificationType.HearingAmendmentRepresentative;
            var oldDate = new DateTime(2020, 2, 10, 11, 30, 0, DateTimeKind.Utc);
            var newDate = new DateTime(2020, 10, 12, 13, 10, 0, DateTimeKind.Utc);
            var caseName = "cse test";
            var caseNumber = "MBFY/17364";
            var participant = InitParticipant("Representative", "Random Person");
            var expectedConferencePhoneNumber = "phone_number";
            var expectedConferencePhoneId = "phone_id";

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"solicitor name", $"{participant.FirstName} {participant.LastName}"},
                {"client name", $"{participant.Representee}"},
                {"Old time", "11:30 AM"},
                {"New time", "2:10 PM"},
                {"Old Day Month Year", "10 February 2020"},
                {"New Day Month Year", "12 October 2020"},
                {"conference phone number", expectedConferencePhoneNumber},
                {"conference phone id", expectedConferencePhoneId}
            };

            var result =
                AddNotificationRequestMapper.MapToHearingAmendmentNotification(_hearing, participant, caseName,
                    caseNumber, oldDate, newDate, expectedConferencePhoneNumber, expectedConferencePhoneId);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(_hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.TelephoneNumber);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }

        [Test]
        public void should_map_to_joh_hearing_amendment_notification()
        {
            var expectedNotificationType = NotificationType.HearingAmendmentJoh;
            var oldDate = new DateTime(2020, 2, 10, 11, 30, 0, DateTimeKind.Utc);
            var newDate = new DateTime(2020, 10, 12, 13, 10, 0, DateTimeKind.Utc);
            var caseName = "cse test";
            var caseNumber = "MBFY/17364";
            var participant = InitParticipant("Judicial Office Holder");
            var expectedConferencePhoneNumber = "phone_number";
            var expectedConferencePhoneId = "phone_id";

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"judicial office holder", $"{participant.FirstName} {participant.LastName}"},
                {"Old time", "11:30 AM"},
                {"New time", "2:10 PM"},
                {"Old Day Month Year", "10 February 2020"},
                {"New Day Month Year", "12 October 2020"},
                {"conference phone number", expectedConferencePhoneNumber},
                {"conference phone id", expectedConferencePhoneId},
            };

            var result =
                AddNotificationRequestMapper.MapToHearingAmendmentNotification(_hearing, participant, caseName,
                    caseNumber, oldDate, newDate, expectedConferencePhoneNumber, expectedConferencePhoneId);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(_hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.TelephoneNumber);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
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