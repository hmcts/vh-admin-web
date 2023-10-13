using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;

namespace AdminWebsite.UnitTests.Helper
{
    public static class HearingResponseV2Builder
    {
        public static HearingDetailsResponseV2 Build()
        {
            return Builder<HearingDetailsResponseV2>.CreateNew()
                .With(x => x.Participants = new List<ParticipantResponseV2>())
                .With(x => x.Cases = new List<CaseResponseV2> { Builder<CaseResponseV2>.CreateNew().Build() })
                .Build(); 
        }

        public static HearingDetailsResponseV2 WithEndPoints(this HearingDetailsResponseV2 hearingDetailsResponse, int size)
        {
            var endPoints = Builder<EndpointResponseV2>.CreateListOfSize(size).Build().ToList();

            hearingDetailsResponse.Endpoints = endPoints;

            return hearingDetailsResponse;
        }

        public static HearingDetailsResponseV2 WithParticipant(this HearingDetailsResponseV2 hearingDetailsResponse, string userRoleName, string contactEmail =null)
        {
            var participant = Builder<ParticipantResponseV2>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = userRoleName);

            if(!string.IsNullOrEmpty(contactEmail))
            {
                participant.With(x => x.ContactEmail = contactEmail);
            }

            hearingDetailsResponse.Participants.Add(participant.Build());

            return hearingDetailsResponse;
        }
         
    }
}
