using System;
using System.Collections.Generic;

namespace AdminWebsite.Models
{
    /// <summary>
    /// Participant request
    /// </summary>
    public class EditTelephoneParticipantRequest
    {
        public EditTelephoneParticipantRequest()
        {
            LinkedParticipants = new List<LinkedParticipant>();
        }

        /// <summary>
        ///     Participant Id
        /// </summary>
        public Guid Id { get; set; }

        /// <summary>
        ///     The name of the participant's case role
        /// </summary>
        public string CaseRoleName { get; set; }

        /// <summary>
        ///     The name of the participant's hearing role
        /// </summary>
        public string HearingRoleName { get; set; }

        /// <summary>
        ///     Participant first name.
        /// </summary>
        public string FirstName { get; set; }

        /// <summary>
        ///     Participant last name.
        /// </summary>
        public string LastName { get; set; }

        /// <summary>
        ///     Participant contact email
        /// </summary>
        public string ContactEmail { get; set; }

        /// <summary>
        ///     Participant telephone number
        /// </summary>
        public string TelephoneNumber { get; set; }

        /// <summary>
        ///     Participant telephone number
        /// </summary>
        public string MobileNumber { get; set; }

        /// <summary>
        ///     Gets or sets the person name that Representative represents.
        /// </summary>
        public string Representee { get; set; }

        /// <summary>
        ///     The participant linked to this participant response
        /// </summary>
        public List<LinkedParticipant> LinkedParticipants { get; set; }

        private sealed class EditTelephoneParticipantRequestEqualityComparer : IEqualityComparer<EditTelephoneParticipantRequest>
        {
            public bool Equals(EditTelephoneParticipantRequest x, EditTelephoneParticipantRequest y)
            {
                if (ReferenceEquals(x, y)) return true;
                if (ReferenceEquals(x, null)) return false;
                if (ReferenceEquals(y, null)) return false;
                if (x.GetType() != y.GetType()) return false;
                return Nullable.Equals(x.Id, y.Id) && x.TelephoneNumber == y.TelephoneNumber &&
                       x.Representee == y.Representee;
            }

            public int GetHashCode(EditTelephoneParticipantRequest obj)
            {
                var hashCode = new HashCode();
                hashCode.Add(obj.Id);
                hashCode.Add(obj.TelephoneNumber);
                hashCode.Add(obj.MobileNumber);
                hashCode.Add(obj.Representee);
                return hashCode.ToHashCode();
            }
        }

        public static IEqualityComparer<EditTelephoneParticipantRequest> EditTelephoneParticipantRequestComparer { get; } = new EditTelephoneParticipantRequestEqualityComparer();

    }
}
