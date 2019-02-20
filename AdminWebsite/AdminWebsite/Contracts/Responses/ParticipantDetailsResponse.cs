using System;

namespace AdminWebsite.Contracts.Responses
{
    public sealed class ParticipantDetailsResponse : IEquatable<ParticipantDetailsResponse>
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public string DisplayName { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public string Phone { get; set; }

        public bool Equals(ParticipantDetailsResponse other)
        {
            if (other is null)
            {
                return false;
            }

            return Id == other.Id &&
                Title == other.Title &&
                FirstName == other.FirstName &&
                MiddleName == other.MiddleName &&
                LastName == other.LastName &&
                DisplayName == other.DisplayName &&
                Email == other.Email &&
                Role == other.Role &&
                Phone == other.Phone;
        }

        public override bool Equals(object obj)
        {
            return Equals(obj as ParticipantDetailsResponse);
        }

        public override int GetHashCode()
        {
            return (Id, Title, FirstName, MiddleName, LastName, DisplayName, Email, Role, Phone).GetHashCode();
        }
    }
}
