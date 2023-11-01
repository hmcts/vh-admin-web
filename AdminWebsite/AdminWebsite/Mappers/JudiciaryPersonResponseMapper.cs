using AdminWebsite.Contracts.Responses;
namespace AdminWebsite.Mappers
{
    public static class JudiciaryPersonResponseMapper
    {
        public static JudiciaryPerson MapToAdminWebResponse(this BookingsApi.Contract.V1.Responses.JudiciaryPersonResponse judiciaryPersonResponse)
        {
            return new JudiciaryPerson()
            {
                Email = judiciaryPersonResponse.Email,
                Title = judiciaryPersonResponse.Title,
                FirstName = judiciaryPersonResponse.FirstName,
                LastName = judiciaryPersonResponse.LastName,
                FullName = judiciaryPersonResponse.FullName,
                PersonalCode = judiciaryPersonResponse.PersonalCode,
                WorkPhone = judiciaryPersonResponse.WorkPhone
            };
        }
    }
}