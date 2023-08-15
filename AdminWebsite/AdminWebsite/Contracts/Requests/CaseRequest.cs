namespace AdminWebsite.Contracts.Requests;

public class CaseRequest
{
    public string Number { get; set; }
    public string Name { get; set; }
    public bool IsLeadCase { get; set; }
}