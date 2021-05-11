using System;
using System.Collections.Generic;

namespace AdminWebsite.Models
{
    /// <summary>
    /// Participant request
    /// </summary>
    public class EditParticipantRequest
    {
        public EditParticipantRequest()
        {
            LinkedParticipants = new List<LinkedParticipant>();
        }
        
        /// <summary>
        ///     Participant Id.
        /// </summary>
        public Guid? Id { get; set; }

        /// <summary>
        ///     Participant Title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        ///     Participant first name.
        /// </summary>
        public string FirstName { get; set; }

        /// <summary>
        ///     Participant middle name.
        /// </summary>
        public string MiddleNames { get; set; }

        /// <summary>
        ///     Participant last name.
        /// </summary>
        public string LastName { get; set; }

        /// <summary>
        ///     Participant Contact Email
        /// </summary>
        public string ContactEmail { get; set; }

        /// <summary>
        ///     Participant Telephone number
        /// </summary>
        public string TelephoneNumber { get; set; }

        /// <summary>
        ///     Participant Display Name
        /// </summary>
        public string DisplayName { get; set; }

        /// <summary>
        ///     The name of the participant's case role
        /// </summary>
        public string CaseRoleName { get; set; }

        /// <summary>
        ///     The name of the participant's hearing role
        /// </summary>
        public string HearingRoleName { get; set; }

        /// <summary>
        /// The representee of a representative
        /// </summary>
        public string Representee { get; set; }

        /// <summary>
        /// Organisation name
        /// </summary>
        public string OrganisationName { get; set; }

        /// <summary>
        ///     List of linked participants
        /// </summary>
        public IList<LinkedParticipant> LinkedParticipants { get; set; }
        
        private sealed class EditParticipantRequestEqualityComparer : IEqualityComparer<EditParticipantRequest>
        {
            public bool Equals(EditParticipantRequest x, EditParticipantRequest y)
            {
                if (ReferenceEquals(x, y)) return true;
                if (ReferenceEquals(x, null)) return false;
                if (ReferenceEquals(y, null)) return false;
                if (x.GetType() != y.GetType()) return false;
                return Nullable.Equals(x.Id, y.Id) && x.Title == y.Title && x.TelephoneNumber == y.TelephoneNumber && x.DisplayName == y.DisplayName && x.Representee == y.Representee && x.OrganisationName == y.OrganisationName;
            }

            public int GetHashCode(EditParticipantRequest obj)
            {
                var hashCode = new HashCode();
                hashCode.Add(obj.Id);
                hashCode.Add(obj.Title);
                hashCode.Add(obj.TelephoneNumber);
                hashCode.Add(obj.DisplayName);
                hashCode.Add(obj.Representee);
                hashCode.Add(obj.OrganisationName);
                return hashCode.ToHashCode();
            }
        }

        public static IEqualityComparer<EditParticipantRequest> EditParticipantRequestComparer { get; } = new EditParticipantRequestEqualityComparer();

    }
}
