using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Models;
using BookingsApi.Contract.Interfaces.Requests;

namespace AdminWebsite.Mappers
{
    public static class DefenceAdvocateMapper
    {
        public static List<DefenceAdvocate> Map(
            IEnumerable<ParticipantResponse> existingParticipants, 
            IEnumerable<IParticipantRequest> newParticipants)
        {
            var existingDefenceAdvocates = existingParticipants
                .Select(ep => new DefenceAdvocate
                {
                    Id = ep.Id,
                    ContactEmail = ep.ContactEmail
                })
                .ToList();
            
            var newDefenceAdvocates = newParticipants
                .Select(np => new DefenceAdvocate
                {
                    Id = null,
                    ContactEmail = np.ContactEmail
                })
                .ToList();

            return existingDefenceAdvocates.Union(newDefenceAdvocates).ToList();
        }
    }
}
