using System.Collections.Generic;
using BookingsApi.Contract.Requests.Enums;

namespace AdminWebsite.Contracts.Requests;

/// <summary>
/// Create a new Justice User
/// </summary>
public class AddNewJusticeUserRequest
{
    /// <summary>
    /// The user's first name
    /// </summary>
    public string FirstName { get; set; }
    
    /// <summary>
    /// The user's last name
    /// </summary>
    public string LastName { get;set; }
    
    /// <summary>
    /// The user's username
    /// </summary>
    public string Username { get;set; }

    /// <summary>
    /// The user's telephone
    /// </summary>
    public string ContactTelephone { get; set; }
    
    /// <summary>
    /// The user's role. This can be a VHO or a Team Lead.
    /// </summary>
    public List<JusticeUserRole> Roles { get; set;}
}