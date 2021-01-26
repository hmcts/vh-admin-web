using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Services.Models;
using AdminWebsite.VideoAPI.Client;
using UpdateParticipantRequest = AdminWebsite.BookingsAPI.Client.UpdateParticipantRequest;

namespace AdminWebsite.Services
{
    public interface IHearingsService
    {
        Task EmailParticipants(HearingDetailsResponse hearing, Dictionary<string, User> newUsernameAdIdDict);
        Task AssignParticipantToCorrectGroups(HearingDetailsResponse hearing,
            Dictionary<string, User> newUsernameAdIdDict);
        Task<UpdateBookingReferenceResult> UpdateBookingReference(Guid hearingId, string errorMessage);
        bool ConferenceExistsWithMeetingRoom(ConferenceDetailsResponse conference);
        Task PopulateUserIdsAndUsernames(IList<BookingsAPI.Client.ParticipantRequest> participants,
            Dictionary<string, User> usernameAdIdDict);
        void AssignEndpointDefenceAdvocates(List<EndpointRequest> endpointsWithDa,
            IReadOnlyCollection<BookingsAPI.Client.ParticipantRequest> participants);

        UpdateHearingRequest MapHearingUpdateRequest(EditHearingRequest editHearingRequest, string updatedBy);
        UpdateParticipantRequest MapUpdateParticipantRequest(EditParticipantRequest participant);
        BookingsAPI.Client.ParticipantRequest MapNewParticipantRequest(EditParticipantRequest participant);
    }
}
