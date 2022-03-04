using System;
using System.Collections.Generic;
using System.Linq;

namespace AdminWebsite.Extensions
{
    public static class QueryExtensions
    {
        public static IEnumerable<T> WhereIf<T>(this IEnumerable<T> source, bool condition, Func<T, bool> predicate) => condition ? source.Where(predicate) : source;
    }
}