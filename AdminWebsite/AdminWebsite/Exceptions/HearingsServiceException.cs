using System;

namespace AdminWebsite.Exceptions;

public class HearingsServiceException : Exception
{
    public HearingsServiceException(string message) : base(message)
    {
    }
}