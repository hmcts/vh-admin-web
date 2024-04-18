namespace AdminWebsite.Models.EditMultiDayHearing
{
    public class ParticipantChanges
    {
        public EditParticipantRequest ParticipantRequest { get; set; }
        public bool TitleChanged { get; set; }
        public bool DisplayNameChanged { get; set; }
        public bool OrganisationNameChanged { get; set; }
        public bool TelephoneChanged { get; set; }
        public bool RepresenteeChanged { get; set; }
    }
}
