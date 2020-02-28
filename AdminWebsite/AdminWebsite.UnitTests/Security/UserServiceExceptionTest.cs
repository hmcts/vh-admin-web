using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Security;
using NUnit.Framework;
using System;
using System.Runtime.Serialization;

namespace AdminWebsite.UnitTests.Security
{
    public class UserServiceExceptionTest
    {
        private UserServiceException _exception;

        [SetUp]
        public void SetUp()
        {
            _exception = new UserServiceException("Error message", "reason");
        }

        [Test]
        public void Should_get_object_data()
        {
            var info = new SerializationInfo(typeof(CaseRequest), new FormatterConverter());
            _exception.GetObjectData(info, new StreamingContext());

            Assert.That(info.ObjectType == typeof(CaseRequest));
        }

        [Test]
        public void Should_throw_inner_exception_by_get_object_data_if_null()
        {
            try
            {
                _exception.GetObjectData(null, new StreamingContext());
            }
            catch (ArgumentNullException x)
            {
                Assert.That(x.ToString().Contains("Value cannot be null"));
            }
        }
            

    }
}
