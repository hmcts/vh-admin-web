namespace AdminWebsite.Contracts.Responses;

public class CaseTypeResponse
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string ServiceId { get; set; }
    public bool IsAudioRecordingAllowed { get; set; }
}