﻿using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.V1.Responses;

namespace AdminWebsite.Mappers
{
    public static class JudgeResponseMapper
    {
        public static JudgeResponse MapTo(JudgeResponse personResponse)
        {
            return new JudgeResponse
            {
                FirstName = personResponse.FirstName,
                LastName = personResponse.LastName,
                Email = personResponse.Email,
                AccountType = JudgeAccountType.Judiciary,
                ContactEmail = personResponse.ContactEmail
            };

        }
    }
}
