namespace AdminWebsite.AcceptanceTests.Data
{
    public class ErrorMessages
    {
        public ErrorMessages()
        {
            PartyErrorMessage = "Please select a party";
            RoleErrorMessage = "Please select a role";
        }

        public string PartyErrorMessage { get; set; }
        public string RoleErrorMessage { get; set; }
    }
}
