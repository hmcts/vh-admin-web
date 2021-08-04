using AdminWebsite.Extensions;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using Newtonsoft.Json;
using NotificationApi.Contract;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using CaseResponse = BookingsApi.Contract.Responses.CaseResponse;

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
        public void should_map_to_ejud_joh_hearing_amendment_notification()
        {
            //Arrange
            const NotificationType expectedNotificationType = NotificationType.HearingAmendmentEJudJoh;
            var oldDate = new DateTime(2020, 2, 12, 11, 30, 0, DateTimeKind.Utc);
            var newDate = new DateTime(2020, 10, 14, 13, 10, 0, DateTimeKind.Utc);
            const string caseName = "Case Name test";
            const string caseNumber = "MBFY/17364";
            var participant = new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Username = "contact@judiciary.hmcts.net",
                CaseRoleName = "caserolename",
                ContactEmail = "contact@judiciary.hmcts.net",
                FirstName = "John",
                HearingRoleName = "hearingrolename",
                LastName = "Doe",
                TelephoneNumber = "0123456789",
                UserRoleName = "Judicial Office Holder",
                DisplayName = "Johnny",
            };
            _hearing.Participants = new List<ParticipantResponse> { participant };

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"judicial office holder", $"{participant.FirstName} {participant.LastName}"},
                {"Old time", "11:30 AM"},
                {"New time", "2:10 PM"},
                {"Old Day Month Year", "12 February 2020"},
                {"New Day Month Year", "14 October 2020"}
            };

            //Act
            var result = AddNotificationRequestMapper.MapToHearingAmendmentNotification(_hearing, participant, caseName, caseNumber, oldDate, newDate);

            //Assert
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
            _hearing.Participants = new List<ParticipantResponse> { participant };
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
                    caseNumber, oldDate, newDate);

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
                Username = "contact@judiciary.hmcts.net",
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
        public void should_map_to_judge_hearing_amendment_notification()
        {
            var expectedNotificationType = NotificationType.HearingAmendmentJudge;
            var oldDate = new DateTime(2020, 2, 10, 11, 30, 0, DateTimeKind.Utc);
            var newDate = new DateTime(2020, 10, 12, 13, 10, 0, DateTimeKind.Utc);
            var caseName = "cse test";
            var caseNumber = "MBFY/17364";
            var participant = InitParticipant("Judge");
            _hearing.OtherInformation = new OtherInformationDetails
            { JudgeEmail = "judge@hmcts.net", JudgePhone = "123456789" }.ToOtherInformationString();

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"judge", participant.DisplayName},
                {"courtroom account username", participant.Username},
                {"Old time", "11:30 AM"},
                {"New time", "2:10 PM"},
                {"Old Day Month Year", "10 February 2020"},
                {"New Day Month Year", "12 October 2020"}
            };

            var result =
                AddNotificationRequestMapper.MapToHearingAmendmentNotification(_hearing, participant, caseName,
                    caseNumber, oldDate, newDate);

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

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"name", $"{participant.FirstName} {participant.LastName}"},
                {"Old time", "11:30 AM"},
                {"New time", "2:10 PM"},
                {"Old Day Month Year", "10 February 2020"},
                {"New Day Month Year", "12 October 2020"}
            };

            var result =
                AddNotificationRequestMapper.MapToHearingAmendmentNotification(_hearing, participant, caseName,
                    caseNumber, oldDate, newDate);

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
            };

            var result =
                AddNotificationRequestMapper.MapToHearingAmendmentNotification(_hearing, participant, caseName,
                    caseNumber, oldDate, newDate);

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

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"judicial office holder", $"{participant.FirstName} {participant.LastName}"},
                {"Old time", "11:30 AM"},
                {"New time", "2:10 PM"},
                {"Old Day Month Year", "10 February 2020"},
                {"New Day Month Year", "12 October 2020"}
            };

            var result =
                AddNotificationRequestMapper.MapToHearingAmendmentNotification(_hearing, participant, caseName,
                    caseNumber, oldDate, newDate);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(_hearing.Id);
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
                Cases = new List<CaseResponse> { @case },
                ScheduledDateTime = new DateTime(2020, 10, 12, 13, 10, 0, DateTimeKind.Utc),
                OtherInformation = JsonConvert.SerializeObject(new OtherInformationDetails { JudgeEmail = "judge@hmcts.net" }),
                Participants = new List<ParticipantResponse>()
            };
        }

        private ParticipantResponse InitParticipant(string userRole, string representee = null)
        {
            return new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Username = "contact@judiciary.hmcts.net",
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