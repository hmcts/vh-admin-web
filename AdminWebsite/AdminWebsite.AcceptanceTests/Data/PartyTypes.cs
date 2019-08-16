using System.Collections.Generic;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class PartyTypes
    {
        public static IEnumerable<string> MoneyClaimsParty = new List<string>() { PartyType.Claimant.ToString(), PartyType.Defendant.ToString() };
        public static IEnumerable<string> FinancialRemedyParty = new List<string>() { PartyType.Applicant.ToString(), PartyType.Respondent.ToString() };
    }
}
