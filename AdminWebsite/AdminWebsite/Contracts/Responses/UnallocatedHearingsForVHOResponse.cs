namespace AdminWebsite.Contracts.Responses;

public class UnallocatedHearingsForVHOResponse
{
    public int Today { get; set; }
    public int Tomorrow { get; set; }
    public int ThisWeek { get; set; }
    public int ThisMonth { get; set; }
}