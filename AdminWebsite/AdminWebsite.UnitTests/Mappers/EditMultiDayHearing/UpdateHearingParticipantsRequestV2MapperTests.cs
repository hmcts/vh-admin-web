using AdminWebsite.Mappers.EditMultiDayHearing;
using AdminWebsite.Models;
using AdminWebsite.Models.EditMultiDayHearing;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;
using LinkedParticipant = AdminWebsite.Models.EditMultiDayHearing.LinkedParticipant;

namespace AdminWebsite.UnitTests.Mappers.EditMultiDayHearing
{
    public class UpdateHearingParticipantsRequestV2MapperTests
    {
        [Test]
        public void Should_map_participants_for_future_day_hearing()
        {
            // Arrange
            var existingParticipant = new ParticipantResponseV2
            {
                Id = Guid.NewGuid(),
                DisplayName = "Litigant",
                HearingRoleCode = "APPL",
                HearingRoleName = "Applicant",
                UserRoleName = "Individual",
                Title = "Mr",
                FirstName = "Dev",
                MiddleNames = "MiddleNames",
                LastName = "Litigant",
                ContactEmail = "litigant@email.com",
                TelephoneNumber = "0845",
                Username = "litigant@hearings.reform.hmcts.net",
                Organisation = "Organisation",
                Representee = "Representee",
                LinkedParticipants = new List<LinkedParticipantResponseV2>()
            };
            
            var futureDayHearing = new HearingDetailsResponseV2
            {
                Id = Guid.NewGuid(),
                Participants = new List<ParticipantResponseV2>
                {
                    existingParticipant
                }
            };
            var participantsForEditedHearing = new UpdateHearingParticipantsRequestV2
            {
                NewParticipants = new List<ParticipantRequestV2>(),
                ExistingParticipants = new List<UpdateParticipantRequestV2>
                {
                    new()
                    {
                        ParticipantId = Guid.NewGuid(),
                        Title = null,
                        TelephoneNumber = "0845",
                        DisplayName = "Litigant",
                        OrganisationName = null,
                        Representee = null,
                        FirstName = "Dev",
                        MiddleNames = null,
                        LastName = "Litigant",
                        LinkedParticipants = null
                    }
                },
                RemovedParticipantIds = new List<Guid>(),
                LinkedParticipants = new List<LinkedParticipantRequestV2>()
            };
            var hearingChanges = new HearingChanges
            {
                LinkedParticipantChanges = new LinkedParticipantChanges
                {
                    NewLinkedParticipants = new List<LinkedParticipant>(),
                    RemovedLinkedParticipants = new List<LinkedParticipant>()
                },
                ParticipantChanges = new List<ParticipantChanges>()
                {
                    new()
                    {
                        ParticipantRequest = new EditParticipantRequest
                        {
                            Id = Guid.NewGuid(),
                            Title = null,
                            FirstName = "Dev",
                            MiddleNames = null,
                            LastName = "Litigant",
                            ContactEmail = "litigant@email.com",
                            TelephoneNumber = "0845",
                            DisplayName = "Litigant",
                            HearingRoleName = "Applicant",
                            HearingRoleCode = "APPL",
                            Representee = null,
                            OrganisationName = null,
                            LinkedParticipants = new List<AdminWebsite.Models.LinkedParticipant>()
                        }
                    }
                }
            };

            // Act
            var result = UpdateHearingParticipantsRequestV2Mapper.MapParticipantsForFutureDayHearingV2(futureDayHearing, participantsForEditedHearing, hearingChanges);

            // Assert
            var mappedExistingParticipant = result.ExistingParticipants[0];
            mappedExistingParticipant.Title.Should().Be(existingParticipant.Title);
            mappedExistingParticipant.DisplayName.Should().Be(existingParticipant.DisplayName);
            mappedExistingParticipant.OrganisationName.Should().Be(existingParticipant.Organisation);
            mappedExistingParticipant.TelephoneNumber.Should().Be(existingParticipant.TelephoneNumber);
            mappedExistingParticipant.Representee.Should().Be(existingParticipant.Representee);
            mappedExistingParticipant.ParticipantId.Should().Be(existingParticipant.Id);
            mappedExistingParticipant.FirstName.Should().Be(existingParticipant.FirstName);
            mappedExistingParticipant.MiddleNames.Should().Be(existingParticipant.MiddleNames);
            
            result.Should().NotBeNull();
        }
    }
}
