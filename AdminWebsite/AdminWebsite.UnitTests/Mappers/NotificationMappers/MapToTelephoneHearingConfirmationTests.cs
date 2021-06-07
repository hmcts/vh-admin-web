using System;
using System.Collections.Generic;
using System.Text;
using AdminWebsite.Mappers;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using NotificationApi.Contract;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers.NotificationMappers
{
    public class MapToTelephoneHearingConfirmationTests
    {
        [Test]
        public void Should_map_a_lip_to_telephone_hearing_confirmation_multi_day_notification()
        {
            //Arrange
            const string caseNumber = "MBFY/17364";
            const string caseName = "Test Telephone Participant";
            const int numberOfDays = 5;
            var hearing = new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                TelephoneParticipants = new List<TelephoneParticipantResponse>(),
                Cases = new List<CaseResponse>
                {
                    new CaseResponse
                    {
                        Name = caseName,
                        Number = caseNumber
                    }
                },
                ScheduledDateTime = new DateTime(2020, 2, 10, 12, 15, 0, DateTimeKind.Utc)
            };
            const NotificationType expectedNotificationType = NotificationType.TelephoneHearingConfirmationMultiDay;

            var participant = new TelephoneParticipantResponse
            {
                Id = Guid.NewGuid(),
                CaseRoleName = "Applicant",
                ContactEmail = "contact@judiciary.hmcts.net",
                FirstName = "John",
                HearingRoleName = "Litigant in person",
                LastName = "Doe",
                TelephoneNumber = "0123456789"
            };

            hearing.TelephoneParticipants.Add(participant);

            var expectedParameters = new Dictionary<string, string>
            {
                {"case number", caseNumber},
                {"case name", caseName},
                {"name", $"{participant.FirstName} {participant.LastName}"},
                {"day month year", "10 February 2020"},
                {"time", "12:15 PM"},
                {"number of days", "5"}
            };

            //Act
            var result = AddNotificationRequestMapper.MapToTelephoneHearingConfirmationNotificationMultiDay(hearing, participant, numberOfDays);

            //Assert
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
        public void Should_map_a_lip_to_telephone_hearing_confirmation_single_day_notification()
        {
            //Arrange
            const string caseNumber = "MBFY/17364";
            const string caseName = "Test Telephone Participant";
            var hearing = new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                TelephoneParticipants = new List<TelephoneParticipantResponse>(),
                Cases = new List<CaseResponse>
                {
                    new CaseResponse
                    {
                        Name = caseName,
                        Number = caseNumber
                    }
                },
                ScheduledDateTime = new DateTime(2020, 2, 10, 12, 15, 0, DateTimeKind.Utc)
            };
            const NotificationType expectedNotificationType = NotificationType.TelephoneHearingConfirmation;

            var participant = new TelephoneParticipantResponse
            {
                Id = Guid.NewGuid(),
                CaseRoleName = "Applicant",
                ContactEmail = "contact@judiciary.hmcts.net",
                FirstName = "John",
                HearingRoleName = "Litigant in person",
                LastName = "Doe",
                TelephoneNumber = "0123456789"
            };

            hearing.TelephoneParticipants.Add(participant);

            var expectedParameters = new Dictionary<string, string>
            {
                {"case number", caseNumber},
                {"case name", caseName},
                {"name", $"{participant.FirstName} {participant.LastName}"},
                {"day month year", "10 February 2020"},
                {"time", "12:15 PM"}
            };

            //Act
            var result = AddNotificationRequestMapper.MapToTelephoneHearingConfirmationNotification(hearing, participant);

            //Assert
            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.TelephoneNumber);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }
    }
}
