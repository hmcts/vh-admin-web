
using System.Collections.Generic;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class ParticipantData
    {
        public ParticipantData()
        {
            Telephone = "01230101010";
            HouseNumber = "102";
            Street = "Petty France";
            City = "London";
            County = "Greater London";
            PostCode = "SW1H 9AJ";
        }

        public string Email { get; set; }
        public string Firstname { get; set; }
        public string Lastname { get; set; }
        public string Telephone { get; set; }
        public string DisplayName { get; set; }
        public string HouseNumber { get; set; }
        public string Street { get; set; }
        public string City { get; set; }
        public string County { get; set; }
        public string PostCode { get; set; }

        public static IEnumerable<string> MoneyClaimsParty = new List<string>() { "Claimant", "Defendant" };
        public static IEnumerable<string> FinancialRemedyParty = new List<string>() { "Applicant", "Respondent" };
        public static IEnumerable<string> ClaimantRole = new List<string>() { "Claimant LIP", "Solicitor" };
        public static IEnumerable<string> DefendantRole = new List<string>() { "Defendant LIP", "Solicitor" };
        public static IEnumerable<string> ApplicantRole = new List<string>() { "Applicant LIP", "Solicitor" };
        public static IEnumerable<string> RespondentRole = new List<string>() { "Respondent LIP", "Solicitor" };
    }
}