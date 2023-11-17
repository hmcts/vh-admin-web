namespace AdminWebsite.Contracts.Responses;

public class JudiciaryPerson
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
    ///     Judiciary person's generic status
    /// </summary>
    public bool IsGeneric { get; set; }
}