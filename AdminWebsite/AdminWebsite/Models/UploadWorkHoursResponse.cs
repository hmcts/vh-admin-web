using System.Collections.Generic;

namespace AdminWebsite.Models
{
    public class UploadWorkHoursResponse
    {
        public List<string> FailedUsernames { get; set; } = new List<string>();
    }
}
