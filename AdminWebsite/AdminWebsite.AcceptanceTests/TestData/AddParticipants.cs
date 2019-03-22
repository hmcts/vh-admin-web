
using System.Collections.Generic;

namespace AdminWebsite.AcceptanceTests.TestData
{
    public static class AddParticipants
    {
        public const string Email = "dummyemail01@email.com";
        public const string Firstname = "Dummy01";
        public const string Lastname = "Email";
        public const string Telephone = "01230101010";
        public const string DisplayName = "Dummy01Email";
        public static IEnumerable<string> MoneyClaimsParty = new List<string>() { "Claimant", "Defendant" };
        public static IEnumerable<string> FinancialRemedyParty = new List<string>() { "Applicant", "Respondent" };
        public static IEnumerable<string> ClaimantRole = new List<string>() { "Claimant LIP", "Solicitor" };
        public static IEnumerable<string> DefendantRole = new List<string>() { "Defendant LIP", "Solicitor" };
        public static IEnumerable<string> ApplicantRole = new List<string>() { "Applicant LIP", "Solicitor" };
        public static IEnumerable<string> RespondentRole = new List<string>() { "Respondent LIP", "Solicitor" };
        public const string Claimant = "Claimant";
        public const string Defendant = "Defendant";
        public const string Applicant = "Applicant";
        public const string Respondent = "Respondent";
        public const string CivilMoneyClaims = "Civil Money Claims";
        public const string FinancialRemedy = "Financial Remedy";
        public const string PartyErrorMessage = "Please select a party";
        public const string RoleErrorMessage = "Please select a role";
    }
}