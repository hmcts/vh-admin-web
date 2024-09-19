using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using AdminWebsite.Contracts.Requests;

namespace AdminWebsite.Models
{
    public class EditEndpointRequest
    {
        /// <summary>
        ///     Endpoint Id.
        /// </summary>
        public Guid? Id { get; set; }
        /// <summary>
        ///     The display name for the endpoint
        /// </summary>
        /// 
        [StringLength(255, ErrorMessage = "Display name max length is 255 characters")]
        [RegularExpression(@"^[\p{L}\p{N}\s',._-]+$")]
        public string DisplayName { get; set; }
        /// <summary>
        ///     The username of the participant
        /// </summary>
        public string DefenceAdvocateContactEmail { get; set; }
        
        /// <summary>
        ///     The code for the endpoint's interpreter language, if applicable
        /// </summary>
        public string InterpreterLanguageCode { get; set; }
        
        /// <summary>
        /// Screening requirements for a participant (optional)
        /// </summary>
        public SpecialMeasureScreeningRequest ScreeningRequirements { get; set; }

        private sealed class EditEndpointRequestEqualityComparer : IEqualityComparer<EditEndpointRequest>
        {
            public bool Equals(EditEndpointRequest x, EditEndpointRequest y)
            {
                if (ReferenceEquals(x, y)) return true;
                if (ReferenceEquals(x, null)) return false;
                if (ReferenceEquals(y, null)) return false;
                if (x.GetType() != y.GetType()) return false;
                return Nullable.Equals(x.Id, y.Id) && x.DisplayName == y.DisplayName &&
                       x.DefenceAdvocateContactEmail == y.DefenceAdvocateContactEmail &&
                       x.InterpreterLanguageCode == y.InterpreterLanguageCode;
            }

            public int GetHashCode(EditEndpointRequest obj)
            {
                return HashCode.Combine(obj.Id, obj.DisplayName, obj.DefenceAdvocateContactEmail);
            }
        }

        public static IEqualityComparer<EditEndpointRequest> EditEndpointRequestComparer { get; } = new EditEndpointRequestEqualityComparer();
    }
}
