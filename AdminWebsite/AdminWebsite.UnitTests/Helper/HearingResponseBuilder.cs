using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.Responses;
using FizzWare.NBuilder;

namespace AdminWebsite.UnitTests.Helper
{
    public static class HearingResponseBuilder
    {
        public static HearingDetailsResponse Build()
        {
            return Builder<HearingDetailsResponse>.CreateNew()
                    .With(x => x.Participants = new List<ParticipantResponse>())
                    .With(x => x.Cases = new List<CaseResponse> { Builder<CaseResponse>.CreateNew().Build() })
                    .Build(); 
        }

        public static HearingDetailsResponse WithEndPoints(this HearingDetailsResponse hearingDetailsResponse, int size)
        {
            var endPoints = Builder<EndpointResponse>.CreateListOfSize(size).Build().ToList();

            hearingDetailsResponse.Endpoints = endPoints;

            return hearingDetailsResponse;
        }

        public static HearingDetailsResponse WithParticipant(this HearingDetailsResponse hearingDetailsResponse, string userRoleName, string userName =null)
        {
            var participant = Builder<ParticipantResponse>.CreateNew()
               .With(x => x.Id = Guid.NewGuid())
               .With(x => x.UserRoleName = userRoleName);

            if(!string.IsNullOrEmpty(userName))
            {
                participant.With(x => x.Username = userName);
            }

            hearingDetailsResponse.Participants.Add(participant.Build());

            return hearingDetailsResponse;
        }
         
    }
}
