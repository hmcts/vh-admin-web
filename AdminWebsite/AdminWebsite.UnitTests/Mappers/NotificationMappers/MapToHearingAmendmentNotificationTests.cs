using System;
using System.Collections.Generic;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Mappers;
using FluentAssertions;
using NotificationApi.Contract;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers.NotificationMappers
{
    public class MapToHearingAmendmentNotificationTests
    {
        [Test]
        public void should_map_to_judge_hearing_amendment_notification()
        {
            var expectedNotificationType = NotificationType.HearingAmendmentJudge;
            var hearingId = Guid.NewGuid();
            var oldDate = new DateTime(2020, 2, 10, 11, 30, 0);
            var newDate = new DateTime(2020, 10, 12, 13, 10, 0);
            var caseName = "cse test";
            var caseNumber = "MBFY/17364";
            var participant = InitParticipant("Judge");

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"judge", participant.Display_name},
                {"courtroom account username", participant.Username},
                {"Old time", "11:30 AM"},
                {"New time", "1:10 PM"},
                {"Old Day Month Year", "10 February 2020"},
                {"New Day Month Year", "12 October 2020"}
            };

            var result =
                AddNotificationRequestMapper.MapToHearingAmendmentNotification(hearingId, participant, caseName,
                    caseNumber, oldDate, newDate);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearingId);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.Contact_email);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.Telephone_number);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }

        [Test]
        public void should_map_to_lip_hearing_amendment_notification()
        {
            var expectedNotificationType = NotificationType.HearingAmendmentLip;
            var hearingId = Guid.NewGuid();
            var oldDate = new DateTime(2020, 2, 10, 11, 30, 0);
            var newDate = new DateTime(2020, 10, 12, 13, 10, 0);
            var caseName = "cse test";
            var caseNumber = "MBFY/17364";
            var participant = InitParticipant("Individual");

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"name", $"{participant.First_name} {participant.Last_name}"},
                {"Old time", "11:30 AM"},
                {"New time", "1:10 PM"},
                {"Old Day Month Year", "10 February 2020"},
                {"New Day Month Year", "12 October 2020"}
            };

            var result =
                AddNotificationRequestMapper.MapToHearingAmendmentNotification(hearingId, participant, caseName,
                    caseNumber, oldDate, newDate);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearingId);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.Contact_email);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.Telephone_number);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }

        [Test]
        public void should_map_to_representative_hearing_amendment_notification()
        {
            var expectedNotificationType = NotificationType.HearingAmendmentRepresentative;
            var hearingId = Guid.NewGuid();
            var oldDate = new DateTime(2020, 2, 10, 11, 30, 0);
            var newDate = new DateTime(2020, 10, 12, 13, 10, 0);
            var caseName = "cse test";
            var caseNumber = "MBFY/17364";
            var participant = InitParticipant("Representative", "Random Person");

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"solicitor name", $"{participant.First_name} {participant.Last_name}"},
                {"client name", $"{participant.Representee}"},
                {"Old time", "11:30 AM"},
                {"New time", "1:10 PM"},
                {"Old Day Month Year", "10 February 2020"},
                {"New Day Month Year", "12 October 2020"}
            };

            var result =
                AddNotificationRequestMapper.MapToHearingAmendmentNotification(hearingId, participant, caseName,
                    caseNumber, oldDate, newDate);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearingId);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.Contact_email);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.Telephone_number);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }

        [Test]
        public void should_map_to_joh_hearing_amendment_notification()
        {
            var expectedNotificationType = NotificationType.HearingAmendmentJoh;
            var hearingId = Guid.NewGuid();
            var oldDate = new DateTime(2020, 2, 10, 11, 30, 0);
            var newDate = new DateTime(2020, 10, 12, 13, 10, 0);
            var caseName = "cse test";
            var caseNumber = "MBFY/17364";
            var participant = InitParticipant("Judicial Office Holder");

            var expectedParameters = new Dictionary<string, string>
            {
                {"case name", caseName},
                {"case number", caseNumber},
                {"judicial office holder", $"{participant.First_name} {participant.Last_name}"},
                {"Old time", "11:30 AM"},
                {"New time", "1:10 PM"},
                {"Old Day Month Year", "10 February 2020"},
                {"New Day Month Year", "12 October 2020"}
            };

            var result =
                AddNotificationRequestMapper.MapToHearingAmendmentNotification(hearingId, participant, caseName,
                    caseNumber, oldDate, newDate);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearingId);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.Contact_email);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.Telephone_number);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
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