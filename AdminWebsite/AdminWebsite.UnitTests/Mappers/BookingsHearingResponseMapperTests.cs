using AdminWebsite.Mappers;
using BookingsApi.Contract.V1.Responses;

namespace AdminWebsite.UnitTests.Mappers;

public class BookingsHearingResponseMapperTests
{
    [Test]
    public void Should_map_all_properties_for_BookingsResponse_V1()
    {
        var source = new BookingsResponse
        {
            Limit = 1,
            NextCursor = "nextCursor",
            NextPageUrl = "nextPageUrl",
            PrevPageUrl = "prevPageUrl",
            Hearings = new List<BookingsByDateResponse>
            {
                new ()
                {
                    ScheduledDate = DateTime.UtcNow,
                    Hearings = new List<BookingsHearingResponse>
                    {
                        new ()
                        {
                            HearingId = Guid.NewGuid(),
                            HearingNumber = "hearingNumber",
                            HearingName = "hearingName",
                            ScheduledDateTime = DateTime.UtcNow,
                            ScheduledDuration = 1,
                            CaseTypeName = "caseTypeName",
                            CaseTypeIsAudioRecordingAllowed = true,
                            CourtRoom = "courtRoom",
                            CourtAddress = "courtAddress",
                            JudgeName = "judgeName",
                            CreatedBy = "createdBy",
                            CreatedDate = DateTime.UtcNow,
                            LastEditBy = "lastEditBy",
                            LastEditDate = DateTime.UtcNow,
                            ConfirmedBy = "confirmedBy",
                            ConfirmedDate = DateTime.UtcNow,
                            Status = BookingsApi.Contract.V1.Enums.BookingStatus.Created,
                            AudioRecordingRequired = true,
                            CancelReason = "cancelReason",
                            GroupId = Guid.NewGuid(),
                            CourtRoomAccount = "courtRoomAccount",
                            AllocatedTo = "allocatedTo"
                        }
                    }
                }
            }
        };
        var result = source.Map();
        result.Should().NotBeNull();
        result.Should().BeEquivalentTo(source, options => options.ExcludingMissingMembers());
    }
}