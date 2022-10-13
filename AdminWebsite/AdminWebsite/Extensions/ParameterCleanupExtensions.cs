namespace AdminWebsite.Extensions;

public static class ParameterCleanupExtensions
{
    public static string Sanitise(this string parameter) => parameter.ToLowerInvariant().Trim();
}