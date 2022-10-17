using System.Collections.Generic;

namespace AdminWebsite.Models
{
    public class UploadNonWorkingHoursResponse
    {
        public List<string> FailedUsernames { get; set; } = new List<string>();
    }
}
