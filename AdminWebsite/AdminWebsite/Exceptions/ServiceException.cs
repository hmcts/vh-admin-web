using System;

namespace AdminWebsite.Exceptions;

public class ServiceException(string message) : Exception(message);