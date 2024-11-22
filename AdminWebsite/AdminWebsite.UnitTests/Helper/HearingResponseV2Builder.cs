using System.Linq;
using BookingsApi.Contract.V2.Enums;
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
                .With(x => x.JudicialOfficeHolders = new List<JudiciaryParticipantResponse>())
                .With(x => x.Cases = new List<CaseResponseV2> { Builder<CaseResponseV2>.CreateNew().Build() })
                .Build(); 
        }

        public static HearingDetailsResponseV2 WithEndPoints(this HearingDetailsResponseV2 hearingDetailsResponse, int size)
        {
            var endPoints = Builder<EndpointResponseV2>.CreateListOfSize(size)
                .All()
                .With(x => x.InterpreterLanguage == new InterpreterLanguagesResponse
                {
                    Code = "spa",
                    Value = "Spanish"
                })
                .Build()
                .ToList();

            hearingDetailsResponse.Endpoints = endPoints;

            return hearingDetailsResponse;
        }

        public static HearingDetailsResponseV2 WithSupplier(this HearingDetailsResponseV2 hearingDetailsResponse,
            BookingSupplier supplier)
        {
            hearingDetailsResponse.BookingSupplier = supplier;
            return hearingDetailsResponse;
        }

        public static HearingDetailsResponseV2 WithParticipant(this HearingDetailsResponseV2 hearingDetailsResponse, string userRoleName, string contactEmail =null)
        {
            var judicialRoles = new[] {"Judicial Office Holder", "Panel Member"};
            if (userRoleName == "Judge")
            {
                var joh = Builder<JudiciaryParticipantResponse>.CreateNew()
                    .With(x => x.PersonalCode = "12345678")
                    .With(x => x.HearingRoleCode = JudiciaryParticipantHearingRoleCode.Judge)
                    .With(x => x.Email = contactEmail)
                    .With(x => x.WorkPhone = "0123456789")
                    .With(x => x.OptionalContactEmail = null)
                    .With(x => x.OptionalContactTelephone = null)
                    .With(x => x.InterpreterLanguage == new InterpreterLanguagesResponse
                    {
                        Code = "spa",
                        Value = "Spanish"
                    })
                    .Build();
                
                hearingDetailsResponse.JudicialOfficeHolders.Add(joh);
            }
            else if (judicialRoles.Contains(userRoleName))
            {
                var joh = Builder<JudiciaryParticipantResponse>.CreateNew()
                    .With(x => x.PersonalCode = "87654321")
                    .With(x => x.HearingRoleCode = JudiciaryParticipantHearingRoleCode.PanelMember)
                    .With(x => x.Email = contactEmail)
                    .With(x => x.WorkPhone = "0123456789")
                    .With(x => x.OptionalContactEmail = null)
                    .With(x => x.OptionalContactTelephone = null)
                    .With(x => x.InterpreterLanguage == new InterpreterLanguagesResponse
                    {
                        Code = "spa",
                        Value = "Spanish"
                    })
                    .Build();
                hearingDetailsResponse.JudicialOfficeHolders.Add(joh);
            }
            else
            {
                var participant = Builder<ParticipantResponseV2>.CreateNew()
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.UserRoleName = userRoleName);

                if(!string.IsNullOrEmpty(contactEmail))
                {
                    participant.With(x => x.ContactEmail = contactEmail);
                }
                hearingDetailsResponse.Participants.Add(participant.Build());
            }

            

            return hearingDetailsResponse;
        }
         
    }
}
