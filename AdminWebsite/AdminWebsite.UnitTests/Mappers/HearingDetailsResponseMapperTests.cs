using AdminWebsite.Contracts.Enums;
using AdminWebsite.Mappers;
using AdminWebsite.UnitTests.Helper;
using BookingsApi.Contract.V2.Enums;

namespace AdminWebsite.UnitTests.Mappers;

public class HearingDetailsResponseMapperTests
{
    [TestCase(BookingSupplier.Vodafone)]
    [TestCase(BookingSupplier.Stub)]
    public void should_map_v2_model_to_hearing_detail_response(BookingSupplier bookingSupplier)
    {
        // arrange
        var hearing = HearingResponseV2Builder.Build()
            .WithEndPoints(2)
            .WithParticipant("Representative", "username1@hmcts.net")
            .WithParticipant("Individual", "fname2.lname2@hmcts.net")
            .WithParticipant("Individual", "fname3.lname3@hmcts.net")
            .WithParticipant("Judicial Office Holder", "fname4.lname4@hmcts.net")
            .WithParticipant("Judge", "judge.fudge@hmcts.net")
            .WithSupplier(bookingSupplier);

        // act
        var actual = hearing.Map();

        // assert
        actual.Should().NotBeNull();
        actual.Id.Should().Be(hearing.Id);
        actual.ScheduledDateTime.Should().Be(hearing.ScheduledDateTime);
        actual.ScheduledDuration.Should().Be(hearing.ScheduledDuration);
        actual.HearingVenueCode.Should().Be(hearing.HearingVenueCode);
        actual.CaseType.Should().NotBeNull();
        actual.CaseType.Name.Should().Be(hearing.ServiceName);
        actual.CaseType.ServiceId.Should().Be(hearing.ServiceId);
        actual.CaseType.IsAudioRecordingAllowed.Should().Be(hearing.ServiceIsAudioRecordingAllowed);
        actual.ConferenceSupplier.Should().Be((VideoSupplier)bookingSupplier);
        actual.AllocatedToUsername.Should().Be(hearing.AllocatedToUsername);
    }
}