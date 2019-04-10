using System;
using System.Collections.Generic;

namespace AdminWebsite.Helper
{
    /// <summary>
    /// Helper to use for comparison of classes without having to implement the equality methods
    /// </summary>
    public class Compare<TType> : IEqualityComparer<TType>
    {
        private readonly Func<TType, TType, bool> _condition;
        private readonly Func<TType, int> _hashCode;

        private Compare(Func<TType, TType, bool> condition, Func<TType, int> hashCode)
        {
            _condition = condition;
            _hashCode = hashCode;
        }
        
        public bool Equals(TType x, TType y)
        {
            return _condition(x, y);
        }

        public int GetHashCode(TType obj)
        {
            return _hashCode(obj);
        }
        
        public static Compare<TType> By(Func<TType, TType, bool> condition, Func<TType, int> hashCode)
        {
            return new Compare<TType>(condition, hashCode);
        } 
    }
}