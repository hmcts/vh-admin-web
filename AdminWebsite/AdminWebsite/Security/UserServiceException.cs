using System;
using System.Runtime.Serialization;
using System.Security.Permissions;

namespace AdminWebsite.Security
{
    [Serializable]
    public class UserServiceException : Exception
    {
        public string Reason { get; set; }
        public UserServiceException(string message, string reason) : base($"{message}: {reason}")
        {
            Reason = reason;
        }

        [SecurityPermissionAttribute(SecurityAction.Demand, SerializationFormatter = true)]
        protected UserServiceException(SerializationInfo info, StreamingContext context)
            : base(info, context)
        {
            Reason = info.GetString("Reason");
        }

        [SecurityPermissionAttribute(SecurityAction.Demand, SerializationFormatter = true)]
        public override void GetObjectData(SerializationInfo info, StreamingContext context)
        {
            if (info == null)
            {
                throw new ArgumentNullException("info");
            }

            info.AddValue("Reason", this.Reason);

            // MUST call through to the base class to let it save its own state
            base.GetObjectData(info, context);
        }
    }
}
