namespace AdminWebsite.Contracts.Responses;

public class JudiciaryParticipantResponse
{
    /// <summary>
    ///     Judiciary person's Title.
    /// </summary>
    public string Title { get; set; }

    /// <summary>
    ///     Judiciary person's first name.
    /// </summary>
    public string FirstName { get; set; }

    /// <summary>
    ///     Judiciary person's last name.
    /// </summary>
    public string LastName { get; set; }
        
    /// <summary>
    ///     Judiciary person's full name.
    /// </summary>
    public string FullName { get; set; }
        
    /// <summary>
    ///     Judiciary person's contact email
    /// </summary>
    public string Email { get; set; }
        
    /// <summary>
    ///     Judiciary person's work phone
    /// </summary>
    public string WorkPhone { get; set; }
        
    /// <summary>
    /// The Judiciary person's unique personal code
    /// </summary>
    public string PersonalCode { get; set; }
    
    /// <summary>
    /// The Judiciary person's role code (Judge or Panel Member)
    /// </summary>
    public string RoleCode { get; set; }

    /// <summary>
    /// The judiciary person's display name
    /// </summary>
    public string DisplayName { get; set; }
    
    /// <summary>
    /// Is a generic account, with custom contact details
    /// </summary>
    public bool IsGeneric { get; set; }
    
    /// <summary>
    /// Is an optional contact number for generic accounts
    /// </summary>
    public string OptionalContactEmail { get; set; }
    
    /// <summary>
    /// Is an optional contact number for generic accounts
    /// </summary>
    public string OptionalContactTelephone { get; set; }

    /// <summary>
    /// The judiciary person's interpreter language details
    /// </summary>
    public AvailableLanguageResponse InterpreterLanguage { get; set; }
}