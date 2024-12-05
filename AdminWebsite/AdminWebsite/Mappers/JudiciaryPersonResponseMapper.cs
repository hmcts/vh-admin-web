using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.Mappers
{
    public static class JudiciaryPersonResponseMapper
    {
        public static JudiciaryPerson MapToAdminWebResponse(this JudiciaryPersonResponse judiciaryPersonResponse)
        {
            return new JudiciaryPerson()
            {
                Email = judiciaryPersonResponse.Email,
                Title = judiciaryPersonResponse.Title,
                FirstName = judiciaryPersonResponse.FirstName,
                LastName = judiciaryPersonResponse.LastName,
                FullName = judiciaryPersonResponse.FullName,
                PersonalCode = judiciaryPersonResponse.PersonalCode,
                WorkPhone = judiciaryPersonResponse.WorkPhone,
                IsGeneric = judiciaryPersonResponse.IsGeneric
            };
        }
        
        public static PersonResponseV2 MapToPersonResponse(this JudiciaryPersonResponse judiciaryPersonResponse)
        {
            return new PersonResponseV2()
            {
                Title = judiciaryPersonResponse.Title,
                FirstName = judiciaryPersonResponse.FirstName,
                LastName = judiciaryPersonResponse.LastName,
                ContactEmail = judiciaryPersonResponse.Email,
                Username = judiciaryPersonResponse.Email
            };
        }
    }
}