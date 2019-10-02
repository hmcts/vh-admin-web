using System;
using System.Collections.Generic;
using AdminWebsite.AcceptanceTests.Helpers;

namespace AdminWebsite.AcceptanceTests.Configuration
{
    public class UserAccount
    {
        public Guid Id { get; set; }
        public string Role { get; set; }
        public string AlternativeEmail { get; set; }
        public string Firstname { get; set; }
        public string Lastname { get; set; }
        public string Displayname { get; set; }
        public string Username { get; set; }
        public string CaseRoleName { get; set; }
        public string HearingRoleName { get; set; }
        public string Representee { get; set; }
        public string SolicitorsReference { get; set; }
        public bool DefaultParticipant { get; set; }
        public List<HearingType> UserGroups { get; set; }
    }
}
