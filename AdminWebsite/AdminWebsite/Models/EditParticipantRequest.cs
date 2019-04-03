﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AdminWebsite.Models
{
    /// <summary>
    /// Participant request
    /// </summary>
    public class EditParticipantRequest
    {
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
        /// The solicitor's reference for a participant
        /// </summary>
        public string SolicitorsReference { get; set; }

        /// <summary>
        /// The representee of a representative
        /// </summary>
        public string Representee { get; set; }

        // House/Building number of a participant
        public string HouseNumber { get; set; }

        // Street name of a participant
        public string Street { get; set; }

        // City of a participant
        public string City { get; set; }

        // County of a participant
        public string County { get; set; }

        // Postcode of a participant
        public string Postcode { get; set; }

    }
}
