using System;

namespace AdminWebsite.Models
{
    public sealed class HearingRole : IComparable, IEquatable<HearingRole>
    {
        public HearingRole(string name, string userRole)
        {
            Name = name;
            UserRole = userRole;
        }

        public string Name { get; }
        public string UserRole { get; }

        public int CompareTo(object obj)
        {
            return obj switch
            {
                null => 1,
                HearingRole hearingRole => string.Compare(Name, hearingRole.Name, StringComparison.Ordinal),
                _ => 0
            };
        }

        public override bool Equals(object obj)
        {
            if (!(obj is string other))
            {
                return false;
            }
            return CompareTo(other) == 0;
        }

        public bool Equals(HearingRole other)
        {
            return other != null && (Name == other.Name && UserRole == other.UserRole);
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Name, UserRole);
        }

        public static bool operator ==(HearingRole left, HearingRole right)
        {
            return left?.Equals(right) ?? right is null;
        }

        public static bool operator >(HearingRole left, HearingRole right)
        {
            if (left is null)
                return false;

            return left.CompareTo(right) > 0;
        }

        public static bool operator <(HearingRole left, HearingRole right)
        {
            if (left is null)
                return false;

            return left.CompareTo(right) < 0;
        }

        public static bool operator <=(HearingRole left, HearingRole right)
        {
            return left < right || left == right;
        }

        public static bool operator >=(HearingRole left, HearingRole right)
        {
            return left > right || left == right;
        }

        public static bool operator !=(HearingRole left, HearingRole right)
        {
            return !(left == right);
        }
    }
}