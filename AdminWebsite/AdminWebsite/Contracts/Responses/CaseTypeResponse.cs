namespace AdminWebsite.Contracts.Responses;

public class CaseTypeResponse
{
    public string Name { get; set; }
    public string ServiceId { get; set; }
    public bool IsAudioRecordingAllowed { get; set; }
}