using System;

namespace AdminWebsite.Security
{
    public class UserServiceException : Exception
    {
        public string Reason { get; set; }

        public UserServiceException(string message, string reason) : base($"{message}: {reason}")
        {
            Reason = reason;
        }

        public UserServiceException()
        {
        }
    }
}