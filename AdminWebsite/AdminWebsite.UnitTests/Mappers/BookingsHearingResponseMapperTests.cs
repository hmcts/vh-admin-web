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
                    ScheduledDate = new DateTime(),
                    Hearings = new List<BookingsHearingResponse>
                    {
                        new ()
                        {
                            HearingId = Guid.NewGuid(),
                            HearingNumber = "hearingNumber",
                            HearingName = "hearingName",
                            ScheduledDateTime = new DateTime(),
                            ScheduledDuration = 1,
                            CaseTypeName = "caseTypeName",
                            HearingTypeName = "hearingTypeName",
                            CourtRoom = "courtRoom",
                            CourtAddress = "courtAddress",
                            JudgeName = "judgeName",
                            CreatedBy = "createdBy",
                            CreatedDate = new DateTime(),
                            LastEditBy = "lastEditBy",
                            LastEditDate = new DateTime(),
                            ConfirmedBy = "confirmedBy",
                            ConfirmedDate = new DateTime(),
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